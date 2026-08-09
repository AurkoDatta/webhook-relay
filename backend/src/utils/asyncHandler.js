/**
 * Wraps an async Express handler so a rejected promise (e.g. an awaited
 * Prisma call throwing) is forwarded to `next()` instead of crashing the
 * process or hanging the request. Without this, every controller would need
 * its own try/catch just to reach the global error handler.
 *
 * @param {(req: import('express').Request, res: import('express').Response, next: import('express').NextFunction) => Promise<any>} fn
 */
function asyncHandler(fn) {
  return (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
}

module.exports = asyncHandler;
