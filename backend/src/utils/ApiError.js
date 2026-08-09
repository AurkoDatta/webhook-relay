/**
 * Typed application error. Services/controllers throw this (rather than a
 * plain Error) whenever they want to control the HTTP status code and a
 * stable machine-readable error code, so the global error handler can turn
 * it into the consistent `{ error: { code, message } }` JSON shape without
 * guessing.
 */
class ApiError extends Error {
  /**
   * @param {number} statusCode - HTTP status code to respond with.
   * @param {string} code - Stable, machine-readable error code (SCREAMING_SNAKE_CASE).
   * @param {string} message - Human-readable message safe to return to the client.
   */
  constructor(statusCode, code, message) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
  }
}

module.exports = ApiError;
