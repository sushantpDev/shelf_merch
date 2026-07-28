import crypto from 'node:crypto';
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import { connectTestDb, clearTestDb, disconnectTestDb } from './setup.js';
import { createApp } from '../src/app.js';
import { Tenant } from '../src/modules/tenants/tenant.model.js';
import { User } from '../src/modules/users/user.model.js';
import { RoleAssignment } from '../src/modules/roles/roleAssignment.model.js';
import { Wallet } from '../src/modules/wallets/wallet.model.js';
import { Payment } from '../src/modules/payments/payment.model.js';
import { Invoice } from '../src/modules/invoices/invoice.model.js';
import { signAccessToken } from '../src/modules/auth/auth.service.js';
import { env } from '../src/config/env.js';

const WEBHOOK_SECRET = env.RAZORPAY_WEBHOOK_SECRET || 'test-webhook-secret';

let app;
let tenant;
let wallet;
let adminToken;
let adminUser;

function signWebhookPayload(payload) {
  const raw = JSON.stringify(payload);
  const signature = crypto.createHmac('sha256', WEBHOOK_SECRET).update(raw).digest('hex');
  return { raw, signature };
}

function paymentCapturedEvent({ orderId, paymentId, amountPaise, tenantId, walletId, performedBy }) {
  return {
    event: 'payment.captured',
    payload: {
      payment: {
        entity: {
          id: paymentId,
          order_id: orderId,
          amount: amountPaise,
          notes: { tenantId: String(tenantId), walletId: String(walletId), performedBy: String(performedBy) },
        },
      },
    },
  };
}

beforeAll(async () => {
  await connectTestDb();
  app = createApp();
});
afterAll(disconnectTestDb);

beforeEach(async () => {
  await clearTestDb();
  tenant = await Tenant.create({ name: 'Rubix', slug: 'rubix' });
  adminUser = await User.create({
    tenantId: tenant._id,
    name: 'Admin',
    email: 'admin@test.io',
    status: 'active',
  });
  const assignment = await RoleAssignment.create({
    tenantId: tenant._id,
    userId: adminUser._id,
    role: 'company_admin',
    scopeType: 'tenant',
  });
  adminToken = signAccessToken(adminUser, assignment);
  wallet = await Wallet.create({ tenantId: tenant._id, name: 'Main Wallet', ownerUserId: adminUser._id });
});

describe('Razorpay webhook (§9.3)', () => {
  it('rejects missing signature', async () => {
    const res = await request(app)
      .post('/api/v1/payments/razorpay/webhook')
      .set('Content-Type', 'application/json')
      .send({ event: 'payment.captured' });
    expect(res.status).toBe(400);
  });

  it('rejects invalid signature', async () => {
    const payload = paymentCapturedEvent({
      orderId: 'order_test',
      paymentId: 'pay_test',
      amountPaise: 50_000,
      tenantId: tenant._id,
      walletId: wallet._id,
      performedBy: adminUser._id,
    });
    const res = await request(app)
      .post('/api/v1/payments/razorpay/webhook')
      .set('Content-Type', 'application/json')
      .set('X-Razorpay-Signature', 'bad-signature')
      .send(payload);
    expect(res.status).toBe(400);
  });

  it('credits wallet on payment.captured and is idempotent on replay', async () => {
    const orderId = 'order_test_abc123';
    const paymentId = 'pay_test_xyz789';
    await Payment.create({
      tenantId: tenant._id,
      relatedType: 'wallet_funding',
      relatedId: wallet._id,
      provider: 'razorpay',
      providerRefId: orderId,
      amount: 500,
      status: 'pending',
    });

    const event = paymentCapturedEvent({
      orderId,
      paymentId,
      amountPaise: 50_000,
      tenantId: tenant._id,
      walletId: wallet._id,
      performedBy: adminUser._id,
    });
    const { raw, signature } = signWebhookPayload(event);

    const res1 = await request(app)
      .post('/api/v1/payments/razorpay/webhook')
      .set('Content-Type', 'application/json')
      .set('X-Razorpay-Signature', signature)
      .send(raw);
    expect(res1.status).toBe(200);
    expect(res1.body.handled).toBe(true);
    expect(res1.body.pendingApproval).toBe(true);

    const updatedWallet = await Wallet.findOne({ _id: wallet._id, tenantId: tenant._id });
    expect(updatedWallet.balance).toBe(0);
    expect(updatedWallet.fundingDocument.approvalStatus).toBe('pending');
    expect(updatedWallet.fundingDocument.requestedAmount).toBe(500);
    expect(updatedWallet.fundingMethod).toBe('online');

    const res2 = await request(app)
      .post('/api/v1/payments/razorpay/webhook')
      .set('Content-Type', 'application/json')
      .set('X-Razorpay-Signature', signature)
      .send(raw);
    expect(res2.status).toBe(200);
    expect(res2.body.idempotent).toBe(true);

    expect(await Invoice.countDocuments({ tenantId: tenant._id })).toBe(0);
    const replayWallet = await Wallet.findOne({ _id: wallet._id, tenantId: tenant._id });
    expect(replayWallet.balance).toBe(0);
  });
});

describe('Razorpay verify', () => {
  it('rejects invalid checkout signature', async () => {
    await Payment.create({
      tenantId: tenant._id,
      relatedType: 'wallet_funding',
      relatedId: wallet._id,
      provider: 'razorpay',
      providerRefId: 'order_verify_1',
      razorpayOrderId: 'order_verify_1',
      amount: 100,
      currency: 'INR',
      status: 'pending',
    });

    const res = await request(app)
      .post('/api/v1/payments/razorpay/verify')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        razorpay_order_id: 'order_verify_1',
        razorpay_payment_id: 'pay_verify_1',
        razorpay_signature: 'not-a-valid-signature',
      });

    expect(res.status).toBe(400);
    expect(res.body.error?.code).toBe('INVALID_PAYMENT_SIGNATURE');
  });

  it('rejects missing fields', async () => {
    const res = await request(app)
      .post('/api/v1/payments/razorpay/verify')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ razorpay_order_id: 'order_x' });
    expect(res.status).toBe(400);
  });
});

describe('Invoices (§7.11)', () => {
  it('lists invoices for tenant admin', async () => {
    const payment = await Payment.create({
      tenantId: tenant._id,
      relatedType: 'wallet_funding',
      relatedId: wallet._id,
      provider: 'razorpay',
      providerRefId: 'pay_list_test',
      amount: 1000,
      status: 'succeeded',
    });
    await Invoice.create({
      tenantId: tenant._id,
      invoiceNumber: 'INV-2026-00001',
      paymentId: payment._id,
      lineItems: [
        {
          description: 'Wallet funding',
          hsnCode: '998314',
          quantity: 1,
          unitPrice: 847.46,
          gstRate: 18,
          amount: 847.46,
        },
      ],
      totalAmount: 1000,
      gstAmount: 152.54,
      status: 'paid',
    });

    const res = await request(app)
      .get('/api/v1/invoices')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.items).toHaveLength(1);
    expect(res.body.items[0].invoiceNumber).toBe('INV-2026-00001');
  });
});
