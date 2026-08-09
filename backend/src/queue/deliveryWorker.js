/**
 * The delivery worker: consumes jobs from the `deliveries` queue, performs
 * the signed HTTP POST to a subscriber endpoint, and on failure schedules
 * the next retry itself according to the backoff schedule.
 *
 * Retries are implemented as manual re-enqueues rather than BullMQ's
 * built-in `attempts`/`backoff` job options: the schedule here isn't a
 * clean power-of-2 progression, it varies by plan tier, and — more
 * importantly — a `delivery_attempts` row and the parent `Delivery`'s
 * status/next_retry_at must be durably written between every attempt.
 * BullMQ's automatic retry re-runs the same job without a clean hook for
 * that bookkeeping, so instead this processor always completes normally
 * (never throws for an ordinary delivery failure) and explicitly enqueues
 * a new job for the next attempt when one is due. `attemptHttpDelivery`
 * (the part that actually talks to the network) is kept pure and exported
 * separately so it can be unit tested without a running queue or database.
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
const { getNextAttempt } = require('../utils/backoffSchedule');
const { createQueueConnection } = require('./connection');
const { DELIVERY_QUEUE_NAME, enqueueRetryAttempt } = require('./deliveryQueue');
const { scheduleRepeatingCleanup, startCleanupWorker } = require('./cleanupJob');

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

  if (result.succeeded) {
    await prisma.delivery.update({
      where: { id: deliveryId },
      data: { attemptCount: attemptNumber, lastAttemptedAt: new Date(), status: 'success', nextRetryAt: null },
    });
    logger.info({ deliveryId, attemptNumber, statusCode: result.statusCode }, 'Delivery succeeded');
    return;
  }

  // Failure: decide whether another attempt is allowed under this
  // application's plan tier. This is computed here, after the attempt, so
  // the schedule always reflects the plan tier at the time of failure
  // (e.g. a tenant upgrading mid-retry-sequence gets the benefit of the
  // longer schedule going forward).
  const nextAttempt = getNextAttempt(delivery.endpoint.application.planTier, attemptNumber);

  if (!nextAttempt) {
    await prisma.delivery.update({
      where: { id: deliveryId },
      data: { attemptCount: attemptNumber, lastAttemptedAt: new Date(), status: 'failed', nextRetryAt: null },
    });
    logger.info({ deliveryId, attemptNumber }, 'Delivery permanently failed: retries exhausted');
    return;
  }

  const nextRetryAt = new Date(Date.now() + nextAttempt.delayMs);

  await prisma.delivery.update({
    where: { id: deliveryId },
    data: { attemptCount: attemptNumber, lastAttemptedAt: new Date(), status: 'retrying', nextRetryAt },
  });

  // The DB write above happens before this enqueue, not inside the same
  // transaction as the attempt insert: if the process crashes between the
  // two, the worst case is a delivery stuck in 'retrying' with no queued
  // job, which is the same failure mode as any other queue outage and is
  // recoverable by re-driving stuck deliveries — it never produces a
  // duplicate delivery, because deliveryJobId is deterministic per
  // (deliveryId, attemptNumber).
  await enqueueRetryAttempt(
    {
      deliveryId,
      applicationId: delivery.endpoint.applicationId,
      endpointId: delivery.endpointId,
      eventId: delivery.eventId,
    },
    nextAttempt.nextAttemptNumber,
    nextAttempt.delayMs
  );

  logger.info(
    { deliveryId, attemptNumber, nextAttemptNumber: nextAttempt.nextAttemptNumber, delayMs: nextAttempt.delayMs },
    'Delivery attempt failed, retry scheduled'
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

  // The retention-cleanup worker runs in this same process rather than a
  // third OS process — it's a single lightweight nightly job, not enough
  // work to justify its own always-on process for this project's scale.
  const cleanupWorker = startCleanupWorker();
  scheduleRepeatingCleanup().catch((err) => logger.error({ err }, 'Failed to schedule retention cleanup'));

  logger.info(`Delivery worker started (env=${env.nodeEnv}, concurrency=${WORKER_CONCURRENCY})`);

  function shutdown(signal) {
    logger.info(`${signal} received, draining delivery worker`);
    Promise.all([worker.close(), cleanupWorker.close()])
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
