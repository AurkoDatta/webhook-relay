/**
 * Rate limiting for the ingestion endpoint. Keyed by application id (not
 * IP) because `/api/ingest` is a server-to-server B2B API — the caller is a
 * tenant's backend, not an end-user browser, so limiting by IP would be
 * both wrong (many tenants can share infrastructure/IPs) and easy to
 * evade. Must run after `apiKeyAuthMiddleware`, which resolves
 * `req.application`.
 *
 * Backed by Redis (rather than in-memory) so the limit is enforced
 * consistently even if the API runs as multiple instances, and survives a
 * process restart.
 */

const rateLimit = require('express-rate-limit');
const { RedisStore } = require('rate-limit-redis');
const redisClient = require('../db/redisClient');

// Requests-per-second burst allowance per plan tier. Separate from the
// monthly event-volume cap in planLimits.js, which ingestionService
// enforces independently — this middleware only guards against short bursts
// of abusive/misbehaving traffic.
const BURST_LIMIT_PER_SECOND = { free: 10, pro: 50 };

const ingestRateLimiter = rateLimit({
  windowMs: 1000,
  limit: (req) => BURST_LIMIT_PER_SECOND[req.application?.planTier] ?? BURST_LIMIT_PER_SECOND.free,
  keyGenerator: (req) => req.application?.id ?? req.ip,
  standardHeaders: true,
  legacyHeaders: false,
  store: new RedisStore({
    prefix: 'ingest-rl:',
    sendCommand: (...args) => redisClient.call(...args),
  }),
  message: {
    error: { code: 'RATE_LIMITED', message: 'Too many requests. Slow down and try again shortly.' },
  },
});

module.exports = { ingestRateLimiter };
