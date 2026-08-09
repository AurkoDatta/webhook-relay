/**
 * Read-side attempt history plus manual replay. Replay always creates a
 * new Delivery row rather than mutating the original one, so the original
 * failure's attempt history stays intact for auditing — see the comment on
 * `replayedFromDeliveryId` in schema.prisma.
 */

const prisma = require('../db/prismaClient');
const { enqueueInitialAttempt } = require('../queue/deliveryQueue');

function toPublicAttempt(attempt) {
  return {
    id: attempt.id,
    attemptNumber: attempt.attemptNumber,
    statusCode: attempt.statusCode,
    responseBodyTruncated: attempt.responseBodyTruncated,
    latencyMs: attempt.latencyMs,
    attemptedAt: attempt.attemptedAt,
    succeeded: attempt.succeeded,
  };
}

function toPublicDelivery(delivery) {
  return {
    id: delivery.id,
    eventId: delivery.eventId,
    endpointId: delivery.endpointId,
    status: delivery.status,
    attemptCount: delivery.attemptCount,
    lastAttemptedAt: delivery.lastAttemptedAt,
    nextRetryAt: delivery.nextRetryAt,
    replayedFromDeliveryId: delivery.replayedFromDeliveryId,
    createdAt: delivery.createdAt,
  };
}

/** @param {string} deliveryId */
async function getAttemptHistory(deliveryId) {
  const attempts = await prisma.deliveryAttempt.findMany({
    where: { deliveryId },
    orderBy: { attemptNumber: 'asc' },
  });
  return attempts.map(toPublicAttempt);
}

/**
 * Creates a fresh delivery for the same event+endpoint pair and enqueues
 * its first attempt, starting a brand-new backoff sequence independent of
 * whatever happened on the delivery being replayed.
 *
 * @param {import('@prisma/client').Delivery & { endpoint: import('@prisma/client').Endpoint }} delivery - already ownership-checked by tenantScopeGuard
 */
async function replayDelivery(delivery) {
  const newDelivery = await prisma.delivery.create({
    data: {
      eventId: delivery.eventId,
      endpointId: delivery.endpointId,
      status: 'pending',
      replayedFromDeliveryId: delivery.id,
    },
  });

  await enqueueInitialAttempt({
    deliveryId: newDelivery.id,
    applicationId: delivery.endpoint.applicationId,
    endpointId: delivery.endpointId,
    eventId: delivery.eventId,
  });

  return toPublicDelivery(newDelivery);
}

module.exports = { getAttemptHistory, replayDelivery };
