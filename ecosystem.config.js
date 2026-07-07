/**
 * PM2 process manager — run on the VPS after `npm run build`.
 *
 *   npm install
 *   npm run build
 *   pm2 start ecosystem.config.cjs
 *   pm2 save && pm2 startup
 */
module.exports = {
  apps: [
    {
      name: 'shelfmerch-api',
      cwd: './apps/api',
      script: 'src/server.js',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
      },
      max_memory_restart: '512M',
    },
    {
      name: 'shelfmerch-worker',
      cwd: './apps/api',
      script: 'src/jobs/index.js',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
      },
      max_memory_restart: '256M',
    },
  ],
};
