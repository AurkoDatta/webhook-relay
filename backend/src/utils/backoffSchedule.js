/**
 * Exponential backoff schedule for the delivery retry engine.
 *
 * Attempt 1 always fires immediately at ingest time (delay 0) and isn't
 * represented here. `BACKOFF_SCHEDULE_MS[i]` is the delay before attempt
 * `i + 2` — index 0 is the wait before attempt 2, index 1 before attempt 3,
 * and so on. There are exactly 7 entries because the highest plan-tier
 * retry cap (Pro: 8 total attempts) needs at most 7 inter-attempt delays;
 * this is the single source of truth both tiers slice from, rather than
 * maintaining a separate schedule per tier.
 */

const { getPlanLimits } = require('../config/planLimits');

const SECOND = 1000;
const MINUTE = 60 * SECOND;
const HOUR = 60 * MINUTE;

const BACKOFF_SCHEDULE_MS = [
  10 * SECOND, // before attempt 2
  1 * MINUTE, // before attempt 3
  5 * MINUTE, // before attempt 4
  30 * MINUTE, // before attempt 5
  2 * HOUR, // before attempt 6
  6 * HOUR, // before attempt 7
  12 * HOUR, // before attempt 8
];

/**
 * @param {number} attemptNumber - the attempt about to be made (>= 2).
 * @returns {number | null} delay in ms before this attempt, or null if
 *   attemptNumber has no entry in the canonical schedule (either < 2, or
 *   beyond what any plan tier could ever reach).
 */
function getDelayForAttempt(attemptNumber) {
  const index = attemptNumber - 2;
  if (index < 0 || index >= BACKOFF_SCHEDULE_MS.length) return null;
  return BACKOFF_SCHEDULE_MS[index];
}

/**
 * @param {'free' | 'pro'} planTier
 * @returns {number[]} the inter-attempt delays available to this tier, in
 *   order (length = maxRetryAttempts - 1).
 */
function getScheduleForPlanTier(planTier) {
  const { maxRetryAttempts } = getPlanLimits(planTier);
  return BACKOFF_SCHEDULE_MS.slice(0, Math.max(0, maxRetryAttempts - 1));
}

/**
 * Decides what happens after an attempt has just failed: either another
 * attempt is scheduled (with its delay), or retries are exhausted for this
 * plan tier and the delivery should be marked permanently failed.
 *
 * @param {'free' | 'pro'} planTier
 * @param {number} lastAttemptNumber - the attempt number that just failed.
 * @returns {{ nextAttemptNumber: number, delayMs: number } | null} null
 *   means retries are exhausted.
 */
function getNextAttempt(planTier, lastAttemptNumber) {
  const { maxRetryAttempts } = getPlanLimits(planTier);
  const nextAttemptNumber = lastAttemptNumber + 1;
  if (nextAttemptNumber > maxRetryAttempts) return null;

  const delayMs = getDelayForAttempt(nextAttemptNumber);
  if (delayMs === null) return null;

  return { nextAttemptNumber, delayMs };
}

module.exports = { BACKOFF_SCHEDULE_MS, getDelayForAttempt, getScheduleForPlanTier, getNextAttempt };
