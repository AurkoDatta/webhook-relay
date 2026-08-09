/**
 * Global error-handling middleware. Mounted last in the Express app so any
 * error thrown (or passed to `next()`) by an earlier route/middleware ends
 * up here. Guarantees every error response, expected or not, has the same
 * `{ error: { code, message } }` shape.
 */

const { Prisma } = require('@prisma/client');
const ApiError = require('../utils/ApiError');
const logger = require('../utils/logger');

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({ error: { code: err.code, message: err.message } });
  }

  // A unique-constraint violation almost always means the client tried to
  // create something that conflicts with an existing row (e.g. a duplicate
  // email on registration) — surface it as a 409 instead of a 500.
  if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
    return res
      .status(409)
      .json({ error: { code: 'CONFLICT', message: 'A record with these details already exists.' } });
  }

  logger.error({ err }, 'Unhandled error');
  return res
    .status(500)
    .json({ error: { code: 'INTERNAL_ERROR', message: 'Something went wrong. Please try again.' } });
}

module.exports = errorHandler;
