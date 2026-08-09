/**
 * Generates and hashes ingestion API keys, and application signing secrets.
 *
 * API keys are high-entropy random tokens (not human-chosen passwords), so
 * they're hashed with SHA-256 rather than bcrypt: bcrypt's deliberate
 * slowness defends against brute-forcing low-entropy secrets, which is not
 * a concern for 192 bits of randomness, and that slowness would add
 * unnecessary latency to every single `/api/ingest` request (the hot path).
 * Only a short lookup prefix is stored in plaintext, so the ingest
 * middleware can find the candidate row with an indexed query instead of
 * hashing and comparing against every application in the table.
 */

const crypto = require('crypto');

const API_KEY_PREFIX_LABEL = 'whr_live_';
const API_KEY_RANDOM_BYTES = 24; // 24 bytes -> 32 base64url characters
const LOOKUP_PREFIX_LENGTH = 12;
const SIGNING_SECRET_LABEL = 'whsec_';
const SIGNING_SECRET_BYTES = 32;

/**
 * @returns {{ fullKey: string, prefix: string, hash: string }}
 */
function generateApiKey() {
  const random = crypto.randomBytes(API_KEY_RANDOM_BYTES).toString('base64url');
  const fullKey = `${API_KEY_PREFIX_LABEL}${random}`;
  return {
    fullKey,
    prefix: random.slice(0, LOOKUP_PREFIX_LENGTH),
    hash: hashApiKey(fullKey),
  };
}

/**
 * @param {string} fullKey
 * @returns {string} hex-encoded SHA-256 digest of the full key
 */
function hashApiKey(fullKey) {
  return crypto.createHash('sha256').update(fullKey).digest('hex');
}

/**
 * Extracts the indexed lookup prefix from a presented API key, without
 * needing to hash it first.
 * @param {string} fullKey
 * @returns {string | null}
 */
function extractLookupPrefix(fullKey) {
  if (typeof fullKey !== 'string' || !fullKey.startsWith(API_KEY_PREFIX_LABEL)) return null;
  const random = fullKey.slice(API_KEY_PREFIX_LABEL.length);
  return random.slice(0, LOOKUP_PREFIX_LENGTH) || null;
}

/**
 * @returns {string} a new HMAC signing secret, e.g. "whsec_ab12...".
 */
function generateSigningSecret() {
  return `${SIGNING_SECRET_LABEL}${crypto.randomBytes(SIGNING_SECRET_BYTES).toString('hex')}`;
}

/**
 * Masks a secret for display everywhere except the moment it's created or
 * rotated, e.g. "whsec_ab12...9f3d".
 * @param {string} secret
 */
function maskSecret(secret) {
  if (!secret || secret.length <= 12) return '****';
  return `${secret.slice(0, 10)}...${secret.slice(-4)}`;
}

module.exports = {
  generateApiKey,
  hashApiKey,
  extractLookupPrefix,
  generateSigningSecret,
  maskSecret,
};
