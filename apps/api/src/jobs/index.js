/** Worker process entry — run separately from the API: `npm run worker`. */
import { connectDb } from '../config/db.js';
import { logger } from '../config/logger.js';
import { startCsvImportWorker } from './csvImport.worker.js';
import { startNotificationWorker } from './notification.worker.js';
import { startAnalyticsWorker } from './analytics.worker.js';

async function main() {
  await connectDb();
  const workers = [startCsvImportWorker(), startNotificationWorker(), await startAnalyticsWorker()];
  logger.info('Background workers running (csv-import, notifications, analytics)');

  const shutdown = async () => {
    await Promise.all(workers.map((w) => w.close()));
    process.exit(0);
  };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

main().catch((err) => {
  logger.error({ err }, 'Worker startup failed');
  process.exit(1);
});
