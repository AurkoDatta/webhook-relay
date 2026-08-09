/**
 * Central environment variable loader. Every other module reads config
 * through this file rather than calling `process.env` directly, so a
 * missing required variable fails fast at startup instead of surfacing as a
 * confusing runtime error deep inside a request handler.
 */

require('dotenv').config();

const REQUIRED_VARS = ['DATABASE_URL', 'REDIS_URL', 'JWT_SECRET'];

for (const name of REQUIRED_VARS) {
  if (!process.env[name]) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
}

const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT) || 4000,

  databaseUrl: process.env.DATABASE_URL,
  testDatabaseUrl: process.env.TEST_DATABASE_URL,

  redisUrl: process.env.REDIS_URL,

  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',

  cookieSecure: process.env.COOKIE_SECURE === 'true',
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173',
};

module.exports = env;
