/**
 * HMAC-SHA256 signing and verification for outbound webhook deliveries.
 *
 * The signed string is `${timestamp}.${rawBody}` rather than just the body:
 * binding the timestamp into the signature is what lets a subscriber reject
 * a replayed request (an attacker who captured a valid, old request+
 * signature pair cannot resend it after checking the timestamp is stale),
 * not just a tampered one.
 */

const crypto = require('crypto');

const SIGNED_PAYLOAD_SEPARATOR = '.';

/**
 * @param {string} secret - the application's signing secret.
 * @param {string} rawBody - the exact JSON string sent as the request body.
 * @param {string | number} timestamp - unix time (ms) the request was sent.
 * @returns {string} hex-encoded HMAC-SHA256 signature.
 */
function signPayload(secret, rawBody, timestamp) {
  const signedPayload = `${timestamp}${SIGNED_PAYLOAD_SEPARATOR}${rawBody}`;
  return crypto.createHmac('sha256', secret).update(signedPayload).digest('hex');
}

/**
 * Verifies a signature a subscriber (or, in our tests, this same code)
 * would compute. Uses a constant-time comparison so response timing can't
 * leak information about how close a guessed signature was to correct.
 *
 * @param {string} secret
 * @param {string} rawBody
 * @param {string | number} timestamp
 * @param {string} signature - hex-encoded signature to check.
 * @returns {boolean}
 */
function verifySignature(secret, rawBody, timestamp, signature) {
  if (typeof signature !== 'string' || signature.length === 0) return false;

  const expected = signPayload(secret, rawBody, timestamp);
  const expectedBuffer = Buffer.from(expected, 'hex');
  const providedBuffer = Buffer.from(signature, 'hex');

  // timingSafeEqual throws if buffer lengths differ, which would itself be
  // a signal in a naive implementation — guard it explicitly instead.
  if (expectedBuffer.length !== providedBuffer.length) return false;

  return crypto.timingSafeEqual(expectedBuffer, providedBuffer);
}

module.exports = { signPayload, verifySignature };
