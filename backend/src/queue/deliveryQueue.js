/**
 * BullMQ producer side: the Queue instance ingestionService enqueues jobs
 * onto, plus the helper for scheduling a delivery's very first attempt.
 * Later attempts (once retry/backoff exists) are enqueued by the worker
 * itself, not from here — see deliveryWorker.js.
 */

const { Queue } = require('bullmq');
const { createQueueConnection } = require('./connection');

const DELIVERY_QUEUE_NAME = 'deliveries';

const deliveryQueue = new Queue(DELIVERY_QUEUE_NAME, { connection: createQueueConnection() });

/**
 * Builds the deterministic BullMQ job id for a given delivery/attempt pair.
 * Because BullMQ treats job ids as unique keys, adding a job with an id
 * that's already active/waiting is a no-op — this is the first of the two
 * idempotency guards described in deliveryWorker.js (the second, and
 * authoritative, guard is the DB unique constraint on
 * delivery_attempts(delivery_id, attempt_number)).
 *
 * @param {string} deliveryId
 * @param {number} attemptNumber
 */
function deliveryJobId(deliveryId, attemptNumber) {
  // BullMQ rejects custom job ids containing ":", so "-" is used as the
  // separator instead.
  return `delivery-${deliveryId}-attempt-${attemptNumber}`;
}

/**
 * Enqueues attempt #1 for a newly created delivery.
 * @param {{ deliveryId: string, applicationId: string, endpointId: string, eventId: string }} params
 */
async function enqueueInitialAttempt({ deliveryId, applicationId, endpointId, eventId }) {
  await deliveryQueue.add(
    'deliver',
    { deliveryId, applicationId, endpointId, eventId, attemptNumber: 1 },
    { jobId: deliveryJobId(deliveryId, 1) }
  );
}

/**
 * Enqueues a retry after a previous attempt failed, delayed according to
 * the backoff schedule. Uses the same deterministic job-id scheme as the
 * initial attempt, so re-scheduling the same retry twice (e.g. a crash
 * right after the DB update but before this call, followed by a recovery
 * re-run) is a no-op at the BullMQ level rather than a duplicate job.
 *
 * @param {{ deliveryId: string, applicationId: string, endpointId: string, eventId: string }} params
 * @param {number} attemptNumber - the attempt being scheduled (>= 2).
 * @param {number} delayMs - milliseconds to wait before this attempt runs.
 */
async function enqueueRetryAttempt({ deliveryId, applicationId, endpointId, eventId }, attemptNumber, delayMs) {
  await deliveryQueue.add(
    'deliver',
    { deliveryId, applicationId, endpointId, eventId, attemptNumber },
    { jobId: deliveryJobId(deliveryId, attemptNumber), delay: delayMs }
  );
}

module.exports = {
  deliveryQueue,
  DELIVERY_QUEUE_NAME,
  deliveryJobId,
  enqueueInitialAttempt,
  enqueueRetryAttempt,
};
