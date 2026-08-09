/**
 * Read-side queries for ingested events: paginated/filterable listing, and
 * a single event's detail including per-endpoint delivery fan-out status.
 */

const prisma = require('../db/prismaClient');

function toPublicEvent(event) {
  return { id: event.id, eventType: event.eventType, payload: event.payload, createdAt: event.createdAt };
}

function toPublicDeliverySummary(delivery) {
  return {
    id: delivery.id,
    endpointId: delivery.endpointId,
    endpointUrl: delivery.endpoint.url,
    status: delivery.status,
    attemptCount: delivery.attemptCount,
    lastAttemptedAt: delivery.lastAttemptedAt,
    nextRetryAt: delivery.nextRetryAt,
    replayedFromDeliveryId: delivery.replayedFromDeliveryId,
  };
}

/**
 * @param {string} applicationId
 * @param {{ eventType?: string, from?: Date, to?: Date, page: number, pageSize: number }} filters
 */
async function listEvents(applicationId, { eventType, from, to, page, pageSize }) {
  const where = { applicationId };
  if (eventType) where.eventType = eventType;
  if (from || to) {
    where.createdAt = {};
    if (from) where.createdAt.gte = from;
    if (to) where.createdAt.lte = to;
  }

  const [total, events] = await Promise.all([
    prisma.event.count({ where }),
    prisma.event.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
  ]);

  return {
    events: events.map(toPublicEvent),
    pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) || 0 },
  };
}

/** @param {import('@prisma/client').Event} event - already ownership-checked by tenantScopeGuard */
async function getEventDetail(event) {
  const deliveries = await prisma.delivery.findMany({
    where: { eventId: event.id },
    include: { endpoint: true },
    orderBy: { createdAt: 'asc' },
  });

  return { ...toPublicEvent(event), deliveries: deliveries.map(toPublicDeliverySummary) };
}

module.exports = { listEvents, getEventDetail };
