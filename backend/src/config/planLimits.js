/**
 * Single source of truth for simulated plan-tier limits. Nothing here talks
 * to a payment provider — plan tier is just a field on `applications` that
 * can be toggled for demo purposes, and every limit below is enforced as a
 * plain backend validation check.
 */

const PLAN_LIMITS = Object.freeze({
  free: Object.freeze({
    maxApplications: 1,
    maxEndpointsPerApplication: 5,
    maxEventsPerMonth: 1000,
    maxRetryAttempts: 3,
    logRetentionDays: 7,
  }),
  pro: Object.freeze({
    maxApplications: 10,
    maxEndpointsPerApplication: 25,
    maxEventsPerMonth: 100000,
    maxRetryAttempts: 8,
    logRetentionDays: 30,
  }),
});

/**
 * @param {'free' | 'pro'} planTier
 * @returns {{ maxApplications: number, maxEndpointsPerApplication: number, maxEventsPerMonth: number, maxRetryAttempts: number, logRetentionDays: number }}
 */
function getPlanLimits(planTier) {
  return PLAN_LIMITS[planTier] ?? PLAN_LIMITS.free;
}

module.exports = { PLAN_LIMITS, getPlanLimits };
