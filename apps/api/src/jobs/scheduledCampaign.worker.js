import { Queue, Worker } from 'bullmq';
import { ensureRedisReady, getRedis } from '../config/redis.js';
import { logger } from '../config/logger.js';
import { processDueScheduledCampaigns } from '../modules/campaigns/campaigns.service.js';

const QUEUE = 'scheduled-campaigns';
/** Poll frequently so overdue sends recover quickly after downtime. */
const EVERY_MS = 30_000;

async function runDueScheduled() {
  try {
    const results = await processDueScheduledCampaigns({ limit: 50 });
    const ok = results.filter((r) => r.ok).length;
    const failed = results.filter((r) => !r.ok);
    if (ok || failed.length) {
      logger.info(
        { delivered: ok, failed: failed.length, errors: failed.slice(0, 5) },
        'scheduled campaign delivery pass',
      );
    }
  } catch (err) {
    logger.error({ err: err.message }, 'scheduled campaign delivery failed');
  }
}

/**
 * Deliver scheduled campaign invites + point credits at (or after) sendAt.
 * BullMQ repeatable job when Redis is up; in-process interval otherwise.
 * Overdue campaigns are processed immediately on each tick (no silent skip).
 */
export async function startScheduledCampaignWorker() {
  // Catch anything already overdue as soon as the process boots.
  await runDueScheduled();

  if (!(await ensureRedisReady())) {
    const timer = setInterval(runDueScheduled, EVERY_MS);
    timer.unref?.();
    return { close: async () => clearInterval(timer) };
  }

  const connection = getRedis();
  const queue = new Queue(QUEUE, { connection });
  await queue.add(
    'deliver-due',
    {},
    {
      repeat: { every: EVERY_MS },
      jobId: 'scheduled-campaign-deliver',
      removeOnComplete: true,
      removeOnFail: 50,
    },
  );
  const worker = new Worker(QUEUE, runDueScheduled, { connection });
  worker.on('failed', (_job, err) =>
    logger.error({ err: err.message }, 'scheduled campaign job failed'),
  );
  return {
    close: async () => {
      await worker.close();
      await queue.close();
    },
  };
}
