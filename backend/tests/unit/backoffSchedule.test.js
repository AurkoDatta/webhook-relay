const {
  BACKOFF_SCHEDULE_MS,
  getDelayForAttempt,
  getScheduleForPlanTier,
  getNextAttempt,
} = require('../../src/utils/backoffSchedule');

const SECOND = 1000;
const MINUTE = 60 * SECOND;
const HOUR = 60 * MINUTE;

describe('getDelayForAttempt', () => {
  it('returns the exact canonical delay for each attempt from 2 to 8', () => {
    expect(getDelayForAttempt(2)).toBe(10 * SECOND);
    expect(getDelayForAttempt(3)).toBe(1 * MINUTE);
    expect(getDelayForAttempt(4)).toBe(5 * MINUTE);
    expect(getDelayForAttempt(5)).toBe(30 * MINUTE);
    expect(getDelayForAttempt(6)).toBe(2 * HOUR);
    expect(getDelayForAttempt(7)).toBe(6 * HOUR);
    expect(getDelayForAttempt(8)).toBe(12 * HOUR);
  });

  it('returns null for attempt 1 (the initial attempt has no backoff delay)', () => {
    expect(getDelayForAttempt(1)).toBeNull();
  });

  it('returns null beyond the highest attempt any plan tier can reach', () => {
    expect(getDelayForAttempt(9)).toBeNull();
    expect(getDelayForAttempt(100)).toBeNull();
  });

  it('the canonical schedule is monotonically non-decreasing', () => {
    for (let i = 1; i < BACKOFF_SCHEDULE_MS.length; i += 1) {
      expect(BACKOFF_SCHEDULE_MS[i]).toBeGreaterThanOrEqual(BACKOFF_SCHEDULE_MS[i - 1]);
    }
  });
});

describe('getScheduleForPlanTier', () => {
  it('free tier gets exactly maxRetryAttempts - 1 delays (2 delays for 3 max attempts)', () => {
    expect(getScheduleForPlanTier('free')).toEqual([10 * SECOND, 1 * MINUTE]);
  });

  it('pro tier gets exactly maxRetryAttempts - 1 delays (7 delays for 8 max attempts)', () => {
    expect(getScheduleForPlanTier('pro')).toEqual(BACKOFF_SCHEDULE_MS);
    expect(getScheduleForPlanTier('pro')).toHaveLength(7);
  });
});

describe('getNextAttempt', () => {
  it('schedules attempt 2 after attempt 1 fails, for both tiers', () => {
    expect(getNextAttempt('free', 1)).toEqual({ nextAttemptNumber: 2, delayMs: 10 * SECOND });
    expect(getNextAttempt('pro', 1)).toEqual({ nextAttemptNumber: 2, delayMs: 10 * SECOND });
  });

  it('free tier exhausts retries after attempt 3 (its cap)', () => {
    expect(getNextAttempt('free', 3)).toBeNull();
  });

  it('pro tier keeps retrying up to attempt 8 (its cap)', () => {
    expect(getNextAttempt('pro', 7)).toEqual({ nextAttemptNumber: 8, delayMs: 12 * HOUR });
  });

  it('pro tier exhausts retries after attempt 8 (its cap)', () => {
    expect(getNextAttempt('pro', 8)).toBeNull();
  });
});
