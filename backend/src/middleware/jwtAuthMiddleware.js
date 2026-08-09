/**
 * Dashboard session auth. Reads the JWT from the httpOnly cookie set at
 * login (never from an Authorization header — the dashboard never touches
 * the token directly, which is the whole point of storing it httpOnly) and
 * attaches the decoded payload to `req.user`. Deliberately separate from
 * `apiKeyAuthMiddleware`, which authenticates the `/api/ingest` route with
 * a tenant API key instead of a user session.
 */

const jwt = require('jsonwebtoken');
const env = require('../config/env');
const ApiError = require('../utils/ApiError');

const SESSION_COOKIE_NAME = 'webhook_relay_session';

function jwtAuthMiddleware(req, res, next) {
  const token = req.cookies?.[SESSION_COOKIE_NAME];

  if (!token) {
    return next(new ApiError(401, 'UNAUTHENTICATED', 'You must be logged in to do that.'));
  }

  try {
    const payload = jwt.verify(token, env.jwtSecret);
    req.user = { id: payload.sub, email: payload.email };
    return next();
  } catch {
    return next(new ApiError(401, 'UNAUTHENTICATED', 'Your session is invalid or has expired.'));
  }
}

module.exports = jwtAuthMiddleware;
module.exports.SESSION_COOKIE_NAME = SESSION_COOKIE_NAME;
