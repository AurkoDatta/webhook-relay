/**
 * Nightly retention cleanup: deletes events (and, via cascade, their
 * deliveries and delivery_attempts) older than each application's
 * plan-tier log-retention window. Runs as a BullMQ repeatable job on its
 * own queue — kept separate from the delivery queue so a cleanup run never
 * competes with delivery concurrency or pollutes delivery queue-depth
 * stats shown on the analytics dashboard.
 */

const { Queue, Worker } = require('bullmq');
const prisma = require('../db/prismaClient');
const logger = require('../utils/logger');
const { PLAN_LIMITS } = require('../config/planLimits');
const { createQueueConnection } = require('./connection');

const CLEANUP_QUEUE_NAME = 'retention-cleanup';
const NIGHTLY_CRON = '0 3 * * *'; // 03:00 every day
const REPEATABLE_JOB_ID = 'nightly-retention-cleanup';

const cleanupQueue = new Queue(CLEANUP_QUEUE_NAME, { connection: createQueueConnection() });

/**
 * Deletes events past their application's plan-tier retention window, one
 * DELETE per plan tier (the cutoff only depends on tier, not on the
 * individual application).
 * @returns {Promise<number>} total number of events deleted.
 */
async function runRetentionCleanup() {
  let totalDeleted = 0;

  for (const planTier of Object.keys(PLAN_LIMITS)) {
    const { logRetentionDays } = PLAN_LIMITS[planTier];
    const cutoff = new Date(Date.now() - logRetentionDays * 24 * 60 * 60 * 1000);

    const { count } = await prisma.event.deleteMany({
      where: { createdAt: { lt: cutoff }, application: { planTier } },
    });

    totalDeleted += count;
    if (count > 0) {
      logger.info({ planTier, cutoff, deleted: count }, 'Retention cleanup deleted expired events');
    }
  }

  return totalDeleted;
}

/** Registers the nightly repeatable job. Safe to call on every worker startup — BullMQ dedupes by job id. */
async function scheduleRepeatingCleanup() {
  await cleanupQueue.add(
    'cleanup',
    {},
    { repeat: { pattern: NIGHTLY_CRON }, jobId: REPEATABLE_JOB_ID }
  );
}

function startCleanupWorker() {
  const worker = new Worker(
    CLEANUP_QUEUE_NAME,
    async () => {
      const deleted = await runRetentionCleanup();
      logger.info({ deleted }, 'Retention cleanup run completed');
    },
    { connection: createQueueConnection() }
  );

  worker.on('failed', (job, err) => logger.error({ jobId: job?.id, err }, 'Retention cleanup job failed'));
  return worker;
}

module.exports = { CLEANUP_QUEUE_NAME, runRetentionCleanup, scheduleRepeatingCleanup, startCleanupWorker };
