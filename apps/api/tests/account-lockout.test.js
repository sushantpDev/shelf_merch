import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import { connectTestDb, clearTestDb, disconnectTestDb } from './setup.js';
import { createApp } from '../src/app.js';
import { User } from '../src/modules/users/user.model.js';
import { RoleAssignment } from '../src/modules/roles/roleAssignment.model.js';
import { hashPassword } from '../src/modules/auth/auth.service.js';

let app;

beforeAll(async () => {
  await connectTestDb();
  app = createApp();
});
afterAll(disconnectTestDb);
beforeEach(clearTestDb);

async function makeLoginUser() {
  const user = await User.create({
    tenantId: null,
    name: 'Lockout Target',
    email: 'lockme@test.io',
    passwordHash: await hashPassword('correct-horse-1'),
    status: 'active',
  });
  await RoleAssignment.create({
    tenantId: null,
    userId: user._id,
    role: 'platform_support_agent',
    scopeType: 'platform',
  });
  return user;
}

describe('account lockout (B2)', () => {
  it('locks the account after repeated failed logins and refuses even a correct password', async () => {
    await makeLoginUser();

    // 10 consecutive wrong passwords: the account is unauthenticated each time...
    for (let i = 0; i < 10; i += 1) {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: 'lockme@test.io', password: 'wrong-password' });
      expect(res.status).toBe(401);
    }

    // ...and the next attempt is refused with 423 (locked), even with the right password.
    const locked = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'lockme@test.io', password: 'correct-horse-1' });
    expect(locked.status).toBe(423);
    expect(locked.body.error.code).toBe('ACCOUNT_LOCKED');

    const stored = await User.findOne({ email: 'lockme@test.io' });
    expect(stored.lockedUntil).toBeTruthy();
    expect(stored.lockedUntil.getTime()).toBeGreaterThan(Date.now());
  });

  it('a correct login before lockout clears the failed counter', async () => {
    await makeLoginUser();

    await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'lockme@test.io', password: 'wrong-password' })
      .expect(401);

    await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'lockme@test.io', password: 'correct-horse-1' })
      .expect(200);

    const stored = await User.findOne({ email: 'lockme@test.io' });
    expect(stored.failedLoginCount).toBe(0);
    expect(stored.lockedUntil).toBeNull();
  });
});
