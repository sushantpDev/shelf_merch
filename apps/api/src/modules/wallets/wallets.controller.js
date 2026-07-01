import * as walletsService from './wallets.service.js';
import { validNextStatuses } from '../../services/stateMachine.service.js';
import { writeAudit } from '../../services/audit.service.js';

export async function list(req, res) {
  res.json(await walletsService.listWallets({ tenantId: req.tenantId }));
}

export async function getOne(req, res) {
  const wallet = await walletsService.getWallet({ tenantId: req.tenantId, walletId: req.params.id });
  const obj = wallet.toObject();
  res.json({
    ...obj,
    unallocatedAmount: obj.balance - obj.allocatedAmount,
    validNextStatuses: validNextStatuses('wallet', obj.status),
  });
}

export async function create(req, res) {
  const wallet = await walletsService.createWallet({
    tenantId: req.tenantId,
    userId: req.user.userId,
    data: req.body,
  });
  writeAudit({ req, action: 'wallet.create', entityType: 'Wallet', entityId: wallet._id, after: wallet });
  res.status(201).json(wallet);
}

export async function update(req, res) {
  const { before, wallet } = await walletsService.updateWallet({
    tenantId: req.tenantId,
    walletId: req.params.id,
    patch: req.body,
  });
  writeAudit({ req, action: 'wallet.update', entityType: 'Wallet', entityId: wallet._id, before, after: wallet });
  res.json(wallet);
}

export async function fund(req, res) {
  const result = await walletsService.fundWallet({
    tenantId: req.tenantId,
    walletId: req.params.id,
    userId: req.user.userId,
    ...req.body,
  });
  writeAudit({
    req,
    action: 'wallet.fund',
    entityType: 'Wallet',
    entityId: req.params.id,
    after: {
      amount: req.body.amount,
      pending: Boolean(result.pending),
      transactionId: result.transaction?._id ?? null,
    },
  });
  res.status(201).json(result);
}

export async function uploadFundingDocument(req, res) {
  const { url } = await walletsService.uploadFundingDocument({
    tenantId: req.tenantId,
    walletId: req.params.id,
    file: req.file,
  });
  writeAudit({
    req,
    action: 'wallet.funding_document',
    entityType: 'Wallet',
    entityId: req.params.id,
    after: { fileUrl: url },
  });
  const wallet = await walletsService.getWallet({ tenantId: req.tenantId, walletId: req.params.id });
  const obj = wallet.toObject();
  res.json({
    ...obj,
    unallocatedAmount: obj.balance - obj.allocatedAmount,
    validNextStatuses: validNextStatuses('wallet', obj.status),
  });
}

export async function allocate(req, res) {
  const result = await walletsService.allocate({
    tenantId: req.tenantId,
    walletId: req.params.id,
    userId: req.user.userId,
    allocations: req.body.allocations,
  });
  writeAudit({
    req,
    action: 'wallet.allocate',
    entityType: 'Wallet',
    entityId: req.params.id,
    after: { allocations: req.body.allocations },
  });
  res.status(201).json(result);
}

export async function transfer(req, res) {
  const result = await walletsService.transfer({
    tenantId: req.tenantId,
    walletId: req.params.id,
    toWalletId: req.body.toWalletId,
    amount: req.body.amount,
    userId: req.user.userId,
  });
  writeAudit({
    req,
    action: 'wallet.transfer',
    entityType: 'Wallet',
    entityId: req.params.id,
    after: { toWalletId: req.body.toWalletId, amount: req.body.amount },
  });
  res.status(201).json(result);
}

export async function transactions(req, res) {
  res.json(
    await walletsService.listTransactions({
      tenantId: req.tenantId,
      walletId: req.params.id,
      query: req.query,
    }),
  );
}

export async function activate(req, res) {
  const wallet = await walletsService.activate({
    tenantId: req.tenantId,
    walletId: req.params.id,
    userId: req.user.userId,
  });
  writeAudit({ req, action: 'wallet.activate', entityType: 'Wallet', entityId: wallet._id, after: { status: wallet.status } });
  res.json(wallet);
}
