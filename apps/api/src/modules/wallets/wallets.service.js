import { Wallet } from './wallet.model.js';
import { WalletTransaction } from './walletTransaction.model.js';
import { Entity } from '../entities/entity.model.js';
import * as ledger from '../../services/ledger.service.js';
import { uploadFile } from '../../services/storage.service.js';
import { transitionState, transitionThrough, validNextStatuses } from '../../services/stateMachine.service.js';
import { ApiError, NotFoundError } from '../../utils/errors.js';
import { getPagination, paginatedResponse } from '../../utils/pagination.js';

function withMeta(wallet) {
  const obj = wallet.toObject ? wallet.toObject() : wallet;
  return {
    ...obj,
    unallocatedAmount: obj.balance - obj.allocatedAmount,
    validNextStatuses: validNextStatuses('wallet', obj.status),
  };
}

export async function listWallets({ tenantId }) {
  const wallets = await Wallet.find({ tenantId }).sort({ createdAt: -1 });
  return wallets.map(withMeta);
}

export async function getWallet({ tenantId, walletId }) {
  const wallet = await Wallet.findOne({ _id: walletId, tenantId });
  if (!wallet) throw new NotFoundError('Wallet not found');
  return wallet;
}

export async function createWallet({ tenantId, userId, data }) {
  const wallet = await Wallet.create({
    tenantId,
    ownerUserId: userId,
    name: data.name,
    currency: data.currency,
    validFrom: data.validFrom,
    validTo: data.validTo,
    fundingMethod: data.fundingMethod,
    fundingDocument: data.fundingDocument ?? {},
  });
  return withMeta(wallet);
}

export async function updateWallet({ tenantId, walletId, patch }) {
  const wallet = await getWallet({ tenantId, walletId });
  const before = wallet.toObject();
  // Status is never patchable — state machine only (§3.4).
  const { status: _ignored, fundingDocument, ...rest } = patch;
  if (fundingDocument && typeof fundingDocument === 'object') {
    if (Array.isArray(fundingDocument.plannedAllocations)) {
      wallet.fundingDocument.plannedAllocations = fundingDocument.plannedAllocations;
    }
    const { plannedAllocations: _pa, ...docRest } = fundingDocument;
    Object.assign(wallet.fundingDocument, docRest);
  }
  Object.assign(wallet, rest);
  await wallet.save();
  return { before, wallet: withMeta(wallet) };
}

/**
 * §7.4 /fund — PO uploads submit a finance approval request (no ledger credit until
 * platform finance approves). Online payments credit immediately via Razorpay webhook.
 */
export async function fundWallet({
  tenantId,
  walletId,
  userId,
  amount,
  description,
  fundingMethod,
  docType,
  docNumber,
}) {
  const wallet = await getWallet({ tenantId, walletId });

  if (fundingMethod === 'online') {
    throw new ApiError(
      422,
      'Online wallet funding must use Razorpay checkout',
      'USE_RAZORPAY',
    );
  }

  const method = fundingMethod ?? wallet.fundingMethod;

  if (method === 'po_upload') {
    if (wallet.fundingDocument.approvalStatus === 'pending') {
      throw new ApiError(
        422,
        'A funding request is already pending finance approval',
        'FUNDING_PENDING',
      );
    }
    wallet.fundingDocument.approvalStatus = 'pending';
    wallet.fundingDocument.requestedAmount = amount;
    if (docType) wallet.fundingDocument.docType = docType;
    if (docNumber) wallet.fundingDocument.docNumber = docNumber;
    if (wallet.status === 'draft') {
      transitionState('wallet', wallet, 'wallet_created', { userId });
    }
    await wallet.save();
    return {
      pending: true,
      transaction: null,
      wallet: withMeta(await getWallet({ tenantId, walletId })),
    };
  }

  const txn = await ledger.createTransaction({
    tenantId,
    walletId,
    type: 'fund_in',
    amount,
    description: description || `Wallet funded (${wallet.fundingMethod})`,
    performedBy: userId,
  });

  if (wallet.status === 'draft') {
    transitionState('wallet', wallet, 'wallet_created', { userId });
  }
  await wallet.save();

  return { transaction: txn, wallet: withMeta(await getWallet({ tenantId, walletId })) };
}

export async function uploadFundingDocument({ tenantId, walletId, file }) {
  if (!file) throw new ApiError(400, 'No document uploaded', 'MISSING_FILE');
  const wallet = await getWallet({ tenantId, walletId });
  const { url } = await uploadFile({ tenantId, kind: 'document', file });
  wallet.fundingDocument.fileUrl = url;
  await wallet.save();
  return { url, wallet: withMeta(wallet) };
}

export async function allocate({ tenantId, walletId, userId, allocations }) {
  const wallet = await getWallet({ tenantId, walletId });

  // Apply deallocations before increases so freed budget is available in the same batch.
  const ordered = [...allocations].sort((a, b) => a.amount - b.amount);
  const netIncrease = ordered.reduce((sum, a) => sum + Math.max(0, a.amount), 0);
  const unallocated = wallet.balance - wallet.allocatedAmount;
  if (netIncrease > unallocated) {
    throw new ApiError(
      422,
      `Allocations (₹${netIncrease}) exceed unallocated balance (₹${unallocated})`,
      'ALLOCATION_EXCEEDS_BALANCE',
    );
  }

  const txns = await ledger.allocateToEntities({
    tenantId,
    walletId,
    allocations: ordered,
    performedBy: userId,
  });

  const fresh = await getWallet({ tenantId, walletId });
  if (fresh.status === 'entities_added') {
    transitionState('wallet', fresh, 'budget_allocated', { userId });
    await fresh.save();
  }

  return { transactions: txns, wallet: withMeta(fresh) };
}

export async function transfer({ tenantId, walletId, toWalletId, amount, userId }) {
  await getWallet({ tenantId, walletId });
  await getWallet({ tenantId, walletId: toWalletId }); // both must belong to this tenant
  const result = await ledger.transferBetweenWallets({
    tenantId,
    fromWalletId: walletId,
    toWalletId,
    amount,
    performedBy: userId,
  });
  return { ...result, wallet: withMeta(await getWallet({ tenantId, walletId })) };
}

export async function listTransactions({ tenantId, walletId, query }) {
  await getWallet({ tenantId, walletId });
  const { page, limit, skip } = getPagination(query);
  const filter = { tenantId, walletId, ...(query.type ? { type: query.type } : {}) };
  const [items, total] = await Promise.all([
    WalletTransaction.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    WalletTransaction.countDocuments(filter),
  ]);
  return paginatedResponse(items, total, { page, limit });
}

/** §7.4 /activate — only allowed once every setup step is complete. */
export async function activate({ tenantId, walletId, userId }) {
  const wallet = await getWallet({ tenantId, walletId });
  if (wallet.status === 'active') {
    return withMeta(wallet);
  }

  const entities = await Entity.find({ tenantId, walletId });
  const fundedEntities = entities.filter((e) => e.allocatedAmount > 0);
  const hasManager = (e) =>
    Boolean(e.managerUserId || e.managerName?.trim() || e.managerEmail?.trim());

  const problems = [];
  if (wallet.balance <= 0) problems.push('Wallet has no funds');
  if (fundedEntities.length === 0) problems.push('No budget allocated to entities');
  const unmanaged = fundedEntities.filter((e) => !hasManager(e));
  if (unmanaged.length) {
    problems.push(`Departments without a manager: ${unmanaged.map((e) => e.name).join(', ')}`);
  }
  if (problems.length) {
    throw new ApiError(422, 'Wallet setup incomplete', 'WALLET_SETUP_INCOMPLETE', problems);
  }

  transitionThrough('wallet', wallet, 'active', { userId });
  await wallet.save();
  return withMeta(wallet);
}
