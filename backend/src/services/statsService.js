/**
 * Aggregate analytics for an application: totals, delivery status
 * breakdown, live BullMQ queue depth, per-endpoint latency/failure
 * numbers, and a daily success/failure series for the dashboard's
 * success-rate-over-time chart.
 */

const prisma = require('../db/prismaClient');
const { deliveryQueue } = require('../queue/deliveryQueue');

const SUCCESS_RATE_WINDOW_DAYS = 14;

/**
 * @param {string} applicationId
 */
async function getApplicationStats(applicationId) {
  const [totalEvents, deliveryStatusCounts, queueDepth, perEndpoint, dailySeries] = await Promise.all([
    prisma.event.count({ where: { applicationId } }),

    prisma.delivery.groupBy({
      by: ['status'],
      where: { event: { applicationId } },
      _count: { _all: true },
    }),

    deliveryQueue.getJobCounts('waiting', 'delayed', 'active', 'completed', 'failed'),

    prisma.$queryRaw`
      SELECT
        e.id AS "endpointId",
        e.url,
        COUNT(da.id)::int AS "totalAttempts",
        COALESCE(AVG(da.latency_ms), 0)::float AS "avgLatencyMs",
        COALESCE(AVG(CASE WHEN da.succeeded THEN 0 ELSE 1 END), 0)::float AS "failureRate"
      FROM endpoints e
      LEFT JOIN deliveries d ON d.endpoint_id = e.id
      LEFT JOIN delivery_attempts da ON da.delivery_id = d.id
      WHERE e.application_id = ${applicationId}
      GROUP BY e.id, e.url
      ORDER BY e.url ASC
    `,

    prisma.$queryRaw`
      SELECT
        DATE(da.attempted_at) AS day,
        COUNT(*) FILTER (WHERE da.succeeded)::int AS success,
        COUNT(*) FILTER (WHERE NOT da.succeeded)::int AS failure
      FROM delivery_attempts da
      JOIN deliveries d ON d.id = da.delivery_id
      JOIN events ev ON ev.id = d.event_id
      WHERE ev.application_id = ${applicationId}
        AND da.attempted_at >= NOW() - (${SUCCESS_RATE_WINDOW_DAYS}::int * INTERVAL '1 day')
      GROUP BY DATE(da.attempted_at)
      ORDER BY day ASC
    `,
  ]);

  const deliveriesByStatus = { pending: 0, success: 0, failed: 0, retrying: 0 };
  let totalDeliveries = 0;
  for (const row of deliveryStatusCounts) {
    deliveriesByStatus[row.status] = row._count._all;
    totalDeliveries += row._count._all;
  }

  return {
    totalEvents,
    totalDeliveries,
    deliveriesByStatus,
    queueDepth,
    perEndpoint,
    successRateOverTime: dailySeries.map((row) => ({
      date: row.day,
      success: row.success,
      failure: row.failure,
    })),
  };
}

module.exports = { getApplicationStats };
