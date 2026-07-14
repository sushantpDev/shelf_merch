import { Queue, Worker } from 'bullmq';
import { ensureRedisReady, getRedis } from '../config/redis.js';
import { logger } from '../config/logger.js';
import { computeSnapshot } from '../modules/reports/reports.service.js';

const QUEUE = 'analytics';
const EVERY_MS = 15 * 60 * 1000; // refresh the BI read-model every 15 minutes

async function runSnapshot() {
  try {
    await computeSnapshot();
    logger.info('analytics snapshot recomputed');
  } catch (err) {
    logger.error({ err: err.message }, 'analytics snapshot failed');
  }
}

/**
 * §Gap G — periodically recompute the analytics read-model so BI reads never hit
 * live OLTP aggregation. Uses a BullMQ repeatable job when Redis is available;
 * falls back to an in-process interval otherwise (dev / single node).
 */
export async function startAnalyticsWorker() {
  if (!(await ensureRedisReady())) {
    await runSnapshot();
    const timer = setInterval(runSnapshot, EVERY_MS);
    timer.unref?.();
    return { close: async () => clearInterval(timer) };
  }

  const connection = getRedis();
  const queue = new Queue(QUEUE, { connection });
  await queue.add(
    'snapshot',
    {},
    { repeat: { every: EVERY_MS }, jobId: 'analytics-snapshot', removeOnComplete: true, removeOnFail: 50 },
  );
  const worker = new Worker(QUEUE, runSnapshot, { connection });
  worker.on('failed', (_job, err) => logger.error({ err: err.message }, 'analytics job failed'));
  return {
    close: async () => {
      await worker.close();
      await queue.close();
    },
  };
}
