/**
 * ioredis connection factory configured the way BullMQ requires
 * (`maxRetriesPerRequest: null`, `enableReadyCheck: false`). Kept separate
 * from `src/db/redisClient.js`, which is a general-purpose connection used
 * for caching and rate limiting — mixing BullMQ's required options into
 * that connection would change the retry/ready-check behavior of ordinary
 * commands in a way that's easy to forget about later.
 */

const Redis = require('ioredis');
const env = require('../config/env');

function createQueueConnection() {
  return new Redis(env.redisUrl, {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
  });
}

module.exports = { createQueueConnection };
