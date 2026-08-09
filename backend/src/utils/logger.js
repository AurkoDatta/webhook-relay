/**
 * Shared structured logger. A single instance is exported so every module
 * logs through the same pino configuration instead of using `console.log`,
 * which keeps log output consistent between the API process and the worker
 * process.
 */

const pino = require('pino');
const env = require('../config/env');

const logger = pino({
  level: env.nodeEnv === 'test' ? 'silent' : 'info',
  transport:
    env.nodeEnv === 'development'
      ? { target: 'pino-pretty', options: { colorize: true, translateTime: 'SYS:standard' } }
      : undefined,
});

module.exports = logger;
