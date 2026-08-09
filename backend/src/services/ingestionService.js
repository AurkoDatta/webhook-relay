/**
 * Event ingestion: persists an incoming event and fans it out to every
 * matching, active subscriber endpoint for the application — exactly once
 * per call, inside a single transaction, which is what makes a DB-level
 * uniqueness constraint on (event, endpoint) unnecessary (see the comment
 * on the Delivery model in schema.prisma).
 */

const prisma = require('../db/prismaClient');
const ApiError = require('../utils/ApiError');
const logger = require('../utils/logger');
const { getPlanLimits } = require('../config/planLimits');
const { enqueueInitialAttempt } = require('../queue/deliveryQueue');

const WILDCARD_EVENT_TYPE = '*';

function startOfCurrentMonthUtc() {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
}

/**
 * @param {{ applicationId: string, planTier: 'free' | 'pro', eventType: string, payload: object }} input
 * @returns {Promise<{ eventId: string, deliveryCount: number }>}
 */
async function ingestEvent({ applicationId, planTier, eventType, payload }) {
  const limits = getPlanLimits(planTier);

  const eventsThisMonth = await prisma.event.count({
    where: { applicationId, createdAt: { gte: startOfCurrentMonthUtc() } },
  });

  if (eventsThisMonth >= limits.maxEventsPerMonth) {
    throw new ApiError(
      429,
      'MONTHLY_LIMIT_EXCEEDED',
      `The ${planTier} plan allows at most ${limits.maxEventsPerMonth} events per month.`
    );
  }

  const activeEndpoints = await prisma.endpoint.findMany({ where: { applicationId, isActive: true } });
  const targetEndpoints = activeEndpoints.filter(
    (endpoint) =>
      endpoint.subscribedEventTypes.includes(WILDCARD_EVENT_TYPE) ||
      endpoint.subscribedEventTypes.includes(eventType)
  );

  const { event, deliveries } = await prisma.$transaction(async (tx) => {
    const createdEvent = await tx.event.create({ data: { applicationId, eventType, payload } });

    const createdDeliveries = [];
    for (const endpoint of targetEndpoints) {
      const delivery = await tx.delivery.create({
        data: { eventId: createdEvent.id, endpointId: endpoint.id, status: 'pending' },
      });
      createdDeliveries.push(delivery);
    }

    return { event: createdEvent, deliveries: createdDeliveries };
  });

  // Enqueue jobs only after the transaction has committed: if we enqueued
  // inside the transaction and it later rolled back, BullMQ would end up
  // with jobs pointing at delivery rows that never actually existed.
  //
  // The event and delivery rows are already durably persisted at this
  // point, so a failure to enqueue (e.g. a transient Redis blip) must not
  // surface as a 500 implying the ingest was lost — that would be worse
  // than the truth, which is that the event was accepted but one or more
  // deliveries didn't get scheduled. We log and continue; those deliveries
  // are left in 'pending' with no queued job, visible in the dashboard as
  // stuck rather than silently dropped.
  const enqueueResults = await Promise.allSettled(
    deliveries.map((delivery) =>
      enqueueInitialAttempt({
        deliveryId: delivery.id,
        applicationId,
        endpointId: delivery.endpointId,
        eventId: event.id,
      })
    )
  );

  enqueueResults.forEach((result, index) => {
    if (result.status === 'rejected') {
      logger.error(
        { deliveryId: deliveries[index].id, eventId: event.id, err: result.reason },
        'Failed to enqueue delivery job after event was persisted'
      );
    }
  });

  return { eventId: event.id, deliveryCount: deliveries.length };
}

module.exports = { ingestEvent };
