import { describe, it, expect } from 'vitest';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

/**
 * Guards against module-load failures that the Vitest transform tolerates but
 * the real `node src/server.js` does not — e.g. duplicate import bindings from
 * a bad merge. The suite being green under Vitest is NOT proof the app boots,
 * so we load it in a real Node process here.
 */
describe('app boots under native Node (not just the test transform)', () => {
  it('imports app.js and constructs the app without a load error', () => {
    const appUrl = new URL('../src/app.js', import.meta.url);
    const script = `import(${JSON.stringify(appUrl.href)})
      .then((m) => { m.createApp(); console.log('BOOT_OK'); })
      .catch((e) => { console.error(e.message); process.exit(1); });`;

    const result = spawnSync(process.execPath, ['--input-type=module', '-e', script], {
      cwd: fileURLToPath(new URL('..', import.meta.url)),
      encoding: 'utf8',
      env: {
        ...process.env,
        NODE_ENV: 'test',
        MONGODB_URI: process.env.MONGODB_URI || 'mongodb://localhost:27017/shelfmerch_boot_check',
        JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET || 'bootcheckaccesssecret',
        JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || 'bootcheckrefreshsecret',
      },
    });

    const output = `${result.stdout}\n${result.stderr}`;
    expect(output).not.toMatch(/has already been declared|does not provide an export/i);
    expect(result.status, output).toBe(0);
    expect(result.stdout).toContain('BOOT_OK');
  });
});
