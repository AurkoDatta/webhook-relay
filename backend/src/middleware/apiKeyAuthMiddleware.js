/**
 * Ingestion auth. Deliberately separate from `jwtAuthMiddleware` — this
 * authenticates a tenant's server-to-server call to `/api/ingest` using an
 * API key, not a logged-in dashboard user.
 *
 * Lookup is a two-step check rather than a full-table scan: the presented
 * key's lookup prefix (12 chars, stored in plaintext and indexed) narrows
 * the search to a single row, then the full key's SHA-256 hash is compared
 * against the stored hash in constant time. A short-lived Redis cache
 * avoids a DB round trip on every ingest call under load.
 */

const crypto = require('crypto');
const redisClient = require('../db/redisClient');
const prisma = require('../db/prismaClient');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { extractLookupPrefix, hashApiKey } = require('../utils/apiKeyGenerator');

const CACHE_TTL_SECONDS = 60;
const cacheKey = (prefix) => `apikey:${prefix}`;

/** Constant-time comparison of two equal-length hex digests. */
function hashesMatch(a, b) {
  const bufferA = Buffer.from(a, 'hex');
  const bufferB = Buffer.from(b, 'hex');
  if (bufferA.length !== bufferB.length) return false;
  return crypto.timingSafeEqual(bufferA, bufferB);
}

const apiKeyAuthMiddleware = asyncHandler(async (req, res, next) => {
  const header = req.get('authorization') || '';
  const [scheme, presentedKey] = header.split(' ');

  if (scheme !== 'Bearer' || !presentedKey) {
    throw new ApiError(401, 'MISSING_API_KEY', 'Provide the application API key as a Bearer token.');
  }

  const prefix = extractLookupPrefix(presentedKey);
  if (!prefix) {
    throw new ApiError(401, 'INVALID_API_KEY', 'API key is malformed.');
  }

  const presentedHash = hashApiKey(presentedKey);

  const cached = await redisClient.get(cacheKey(prefix));
  if (cached) {
    const record = JSON.parse(cached);
    if (!hashesMatch(record.apiKeyHash, presentedHash)) {
      throw new ApiError(401, 'INVALID_API_KEY', 'API key is invalid.');
    }
    req.application = record;
    return next();
  }

  const application = await prisma.application.findUnique({ where: { apiKeyPrefix: prefix } });

  if (!application || !hashesMatch(application.apiKeyHash, presentedHash)) {
    throw new ApiError(401, 'INVALID_API_KEY', 'API key is invalid.');
  }

  const record = {
    id: application.id,
    planTier: application.planTier,
    signingSecret: application.signingSecret,
    apiKeyHash: application.apiKeyHash,
  };
  await redisClient.set(cacheKey(prefix), JSON.stringify(record), 'EX', CACHE_TTL_SECONDS);

  req.application = record;
  return next();
});

module.exports = apiKeyAuthMiddleware;
