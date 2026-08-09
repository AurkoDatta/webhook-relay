/**
 * The delivery worker: consumes jobs from the `deliveries` queue and
 * performs the actual signed HTTP POST to a subscriber endpoint.
 *
 * This is v1 of the worker — it performs exactly one HTTP attempt per job
 * and records the outcome. Retry/backoff scheduling on failure is added on
 * top of `processDeliveryJob` in a later change, without altering
 * `attemptHttpDelivery` (the part that actually talks to the network),
 * which is why that function is kept pure and separately exported: it can
 * be unit tested (and later reused by the retry path) without a running
 * queue or database.
 *
 * Runs as its own OS process (`npm run dev:worker` / `start:worker`),
 * separate from the API server, so a slow or crashing subscriber endpoint
 * can never block dashboard/ingest HTTP traffic.
 */

const { Worker } = require('bullmq');
const env = require('../config/env');
const prisma = require('../db/prismaClient');
const logger = require('../utils/logger');
const { signPayload } = require('../utils/hmac');
const { createQueueConnection } = require('./connection');
const { DELIVERY_QUEUE_NAME } = require('./deliveryQueue');

const HTTP_TIMEOUT_MS = 10_000;
const RESPONSE_BODY_TRUNCATE_LENGTH = 2000;
const WORKER_CONCURRENCY = 10;

/**
 * Signs and POSTs an event payload to a subscriber endpoint. Deliberately
 * has no knowledge of the database or the retry schedule — it just
 * performs one HTTP attempt and reports what happened, which is what makes
 * it straightforward to unit test.
 *
 * @param {{ url: string, secret: string, payload: object }} params
 * @returns {Promise<{ succeeded: boolean, statusCode: number | null, responseBodyTruncated: string, latencyMs: number }>}
 */
async function attemptHttpDelivery({ url, secret, payload }) {
  const rawBody = JSON.stringify(payload);
  const timestamp = Date.now();
  const signature = signPayload(secret, rawBody, timestamp);

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), HTTP_TIMEOUT_MS);
  const startedAt = Date.now();

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Webhook-Timestamp': String(timestamp),
        'X-Webhook-Signature': signature,
      },
      body: rawBody,
      signal: controller.signal,
    });

    const latencyMs = Date.now() - startedAt;
    const bodyText = await response.text().catch(() => '');

    return {
      succeeded: response.ok,
      statusCode: response.status,
      responseBodyTruncated: bodyText.slice(0, RESPONSE_BODY_TRUNCATE_LENGTH),
      latencyMs,
    };
  } catch (err) {
    const latencyMs = Date.now() - startedAt;
    const reason = err.name === 'AbortError' ? 'Request timed out' : `Request failed: ${err.message}`;
    return {
      succeeded: false,
      statusCode: null,
      responseBodyTruncated: reason.slice(0, RESPONSE_BODY_TRUNCATE_LENGTH),
      latencyMs,
    };
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * BullMQ job processor. Loads the delivery's current context fresh from
 * the database (rather than trusting only what was in the job payload) so
 * an endpoint URL change or pause made after the job was enqueued is
 * respected at delivery time.
 *
 * @param {import('bullmq').Job} job
 */
async function processDeliveryJob(job) {
  const { deliveryId, attemptNumber } = job.data;

  const delivery = await prisma.delivery.findUnique({
    where: { id: deliveryId },
    include: { endpoint: { include: { application: true } }, event: true },
  });

  if (!delivery) {
    logger.warn({ deliveryId }, 'Delivery not found, skipping job');
    return;
  }

  if (!delivery.endpoint.isActive) {
    logger.info({ deliveryId }, 'Endpoint is paused, skipping delivery attempt');
    return;
  }

  const result = await attemptHttpDelivery({
    url: delivery.endpoint.url,
    secret: delivery.endpoint.application.signingSecret,
    payload: {
      id: delivery.event.id,
      type: delivery.event.eventType,
      createdAt: delivery.event.createdAt,
      data: delivery.event.payload,
    },
  });

  try {
    // The DB-level idempotency guard: delivery_attempts has a unique
    // constraint on (delivery_id, attempt_number), so if this exact attempt
    // was already recorded — e.g. the same job somehow got processed twice
    // — this insert fails and we skip re-updating delivery state below.
    await prisma.deliveryAttempt.create({
      data: {
        deliveryId,
        attemptNumber,
        statusCode: result.statusCode,
        responseBodyTruncated: result.responseBodyTruncated,
        latencyMs: result.latencyMs,
        succeeded: result.succeeded,
      },
    });
  } catch (err) {
    if (err.code === 'P2002') {
      logger.warn({ deliveryId, attemptNumber }, 'Duplicate delivery attempt ignored');
      return;
    }
    throw err;
  }

  await prisma.delivery.update({
    where: { id: deliveryId },
    data: {
      attemptCount: attemptNumber,
      lastAttemptedAt: new Date(),
      // Every failure is currently terminal; scheduling a retry instead of
      // marking 'failed' is added in the next phase.
      status: result.succeeded ? 'success' : 'failed',
    },
  });

  logger.info(
    { deliveryId, attemptNumber, succeeded: result.succeeded, statusCode: result.statusCode },
    'Delivery attempt completed'
  );
}

function startWorker() {
  const worker = new Worker(DELIVERY_QUEUE_NAME, processDeliveryJob, {
    connection: createQueueConnection(),
    concurrency: WORKER_CONCURRENCY,
  });

  worker.on('failed', (job, err) => {
    logger.error({ jobId: job?.id, err }, 'Delivery job threw an unhandled error');
  });

  logger.info(`Delivery worker started (env=${env.nodeEnv}, concurrency=${WORKER_CONCURRENCY})`);

  function shutdown(signal) {
    logger.info(`${signal} received, draining delivery worker`);
    worker
      .close()
      .then(() => prisma.$disconnect())
      .finally(() => process.exit(0));
  }

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));

  return worker;
}

// Only start listening for jobs when this file is run directly as the
// worker process — importing it (e.g. from a test) must not have the side
// effect of opening a Redis connection and consuming real jobs.
if (require.main === module) {
  startWorker();
}

module.exports = { attemptHttpDelivery, processDeliveryJob, startWorker };
