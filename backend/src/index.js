/**
 * API server entry point. Only responsibility: bind the Express app to a
 * port. The delivery worker is a separate process (see
 * src/queue/deliveryWorker.js) so a slow/crashing HTTP handler can never
 * block webhook delivery, and vice versa.
 */

const app = require('./app');
const env = require('./config/env');
const logger = require('./utils/logger');

const server = app.listen(env.port, () => {
  logger.info(`API server listening on port ${env.port}`);
});

function shutdown(signal) {
  logger.info(`${signal} received, shutting down API server`);
  server.close(() => process.exit(0));
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
