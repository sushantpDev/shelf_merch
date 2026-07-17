import { env } from './config/env.js';
import { logger } from './config/logger.js';
import { connectDb, disconnectDb } from './config/db.js';
import { initObservability } from './config/observability.js';
import { createApp } from './app.js';
import { startScheduledCampaignWorker } from './jobs/scheduledCampaign.worker.js';

async function main() {
  await initObservability();
  await connectDb();

  // Ensure overdue scheduled sends are recovered even when the dedicated
  // worker process is not running (common in local / single-node deploys).
  const scheduleWorker = await startScheduledCampaignWorker();

  const app = createApp();
  const server = app.listen(env.PORT, env.HOST, () => {
    const base = env.APP_URL.replace(/\/$/, '') || `http://${env.HOST}:${env.PORT}`;
    logger.info(
      {
        host: env.HOST,
        port: env.PORT,
        nodeEnv: env.NODE_ENV,
        appUrl: base,
      },
      `ShelfMerch listening on ${base}`,
    );
  });

  const shutdown = async (signal) => {
    logger.info({ signal }, 'Shutting down');
    server.close(async () => {
      await scheduleWorker.close();
      await disconnectDb();
      process.exit(0);
    });
    setTimeout(() => process.exit(1), 10_000).unref();
  };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

main().catch((err) => {
  logger.error({ err }, 'Fatal startup error');
  process.exit(1);
});
