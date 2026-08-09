/**
 * General-purpose Redis connection, used for the ingest API-key lookup
 * cache and as the rate-limit store. Kept separate from
 * `src/queue/connection.js`, which configures ioredis with the specific
 * options BullMQ requires (`maxRetriesPerRequest: null`,
 * `enableReadyCheck: false`) — mixing those settings into general-purpose
 * command usage would be surprising, so each concern gets its own
 * connection.
 */

const Redis = require('ioredis');
const env = require('../config/env');

const redisClient = new Redis(env.redisUrl);

module.exports = redisClient;
