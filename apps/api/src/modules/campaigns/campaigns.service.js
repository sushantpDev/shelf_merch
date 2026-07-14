import crypto from 'node:crypto';
import { nanoid } from 'nanoid';
import { Campaign } from './campaign.model.js';
import { Recipient } from './recipient.model.js';
import { Entity } from '../entities/entity.model.js';
import { Contact } from '../contacts/contact.model.js';
import { Shop } from '../shops/shop.model.js';
import { Kit } from '../kits/kit.model.js';
import { Wallet } from '../wallets/wallet.model.js';
import { Tenant } from '../tenants/tenant.model.js';
import * as ledger from '../../services/ledger.service.js';
import { transitionState, validNextStatuses, canTransition } from '../../services/stateMachine.service.js';
import { notify } from '../notifications/notifications.service.js';
import { recordUsage } from '../../services/usage.service.js';
import { ApiError, ForbiddenError, NotFoundError } from '../../utils/errors.js';
import { assertEntityAccess } from '../../middleware/abac.middleware.js';

function withCampaignMeta(campaign) {
  const obj = campaign.toObject ? campaign.toObject() : campaign;
  return { ...obj, validNextStatuses: validNextStatuses('campaign', obj.status) };
}

const INCOMPLETE_CAMPAIGN_STATUSES = ['draft', 'recipients_uploaded', 'credits_allocated', 'approved'];

async function assertWalletCanSpend({ tenantId, entityId, amount, user }) {
  const budget = Math.round(amount ?? 0);
  if (budget <= 0) return;
  const { entity, wallet } = await ledger.resolveSpendWalletForEntity({ tenantId, entityId });

  const entityAvailable = Math.max(0, entity.allocatedAmount - entity.spentAmount);

  if (user?.scopeType === 'entity') {
    if (budget > entityAvailable) {
      throw new ApiError(
        422,
        `Insufficient budget: available ₹${entityAvailable}, required ₹${budget}`,
        'INSUFFICIENT_FUNDS',
      );
    }
    if (budget > wallet.balance) {
      throw new ApiError(
        422,
        `Insufficient wallet cash to complete this send (₹${wallet.balance} available)`,
        'INSUFFICIENT_FUNDS',
      );
    }
    return;
  }

  if (budget > wallet.balance) {
    throw new ApiError(
      422,
      `Insufficient wallet balance: cash ₹${wallet.balance}, required ₹${budget}`,
      'INSUFFICIENT_FUNDS',
    );
  }

  const unalloc = Math.max(0, wallet.balance - wallet.allocatedAmount);
  if (budget > unalloc) {
    throw new ApiError(
      422,
      `Insufficient wallet balance: available ₹${unalloc}, required ₹${budget}`,
      'INSUFFICIENT_FUNDS',
    );
  }
}

function transitionRedemption(recipient, toStatus) {
  const from = recipient.redemptionStatus;
  if (!canTransition('redemption', from, toStatus)) {
    throw new ApiError(422, `Invalid redemption transition: ${from} -> ${toStatus}`, 'INVALID_STATE_TRANSITION');
  }
  recipient.redemptionStatus = toStatus;
  const now = new Date();
  if (toStatus === 'opened') recipient.openedAt = now;
  if (toStatus === 'verified') recipient.verifiedAt = now;
  if (toStatus === 'redeemed' || toStatus === 'order_created') recipient.redeemedAt = now;
}

/** Close out a points send when its credit is fully spent — only legal hops. */
function finalizeRecipientRedemption(recipient) {
  if (recipient.redemptionStatus === 'order_created') return;

  const stepsByStatus = {
    invited: ['opened', 'verified', 'redeemed', 'order_created'],
    opened: ['verified', 'redeemed', 'order_created'],
    verified: ['redeemed', 'order_created'],
    redeemed: ['order_created'],
  };
  const steps = stepsByStatus[recipient.redemptionStatus];
  if (!steps) return;

  for (const step of steps) {
    if (recipient.redemptionStatus === 'order_created') break;
    transitionRedemption(recipient, step);
  }
}

export async function listCampaigns({ tenantId, user }) {
  const filter = { tenantId };
  if (user.scopeType === 'entity') {
    filter.entityId = { $in: user.assignedEntityIds };
  }
  const campaigns = await Campaign.find(filter).sort({ createdAt: -1 });
  return campaigns.map(withCampaignMeta);
}

export async function getCampaign({ tenantId, campaignId, user }) {
  const campaign = await Campaign.findOne({ _id: campaignId, tenantId });
  if (!campaign) throw new NotFoundError('Campaign not found');
  if (user?.scopeType === 'entity') {
    const allowed = (user.assignedEntityIds ?? []).map(String);
    if (!allowed.includes(String(campaign.entityId))) throw new ForbiddenError();
  }
  return withCampaignMeta(campaign);
}

export async function createCampaign({ tenantId, userId, user, data }) {
  const entity = await Entity.findOne({ _id: data.entityId, tenantId });
  if (!entity) throw new NotFoundError('Entity not found');
  assertEntityAccess(user, entity._id);

  if (data.shopId) {
    const shop = await Shop.findOne({ _id: data.shopId, tenantId });
    if (!shop) throw new NotFoundError('Shop not found');
  }
  if (data.kitId) {
    const kit = await Kit.findOne({ _id: data.kitId, tenantId });
    if (!kit) throw new NotFoundError('Kit not found');
  }

  const campaign = await Campaign.create({
    tenantId,
    entityId: data.entityId,
    name: data.name,
    type: data.type,
    fulfillmentMode: data.fulfillmentMode,
    singleLocation: data.singleLocation,
    catalogMode: data.catalogMode,
    selectedProductIds: data.selectedProductIds ?? [],
    kitId: data.kitId ?? null,
    shopId: data.shopId ?? null,
    pointsScope: data.pointsScope ?? 'shop',
    message: data.message ?? {},
    schedule: data.schedule ?? { mode: 'now' },
    createdBy: userId,
  });
  return withCampaignMeta(campaign);
}

export async function updateCampaign({ tenantId, campaignId, user, patch }) {
  const campaign = await Campaign.findOne({ _id: campaignId, tenantId });
  if (!campaign) throw new NotFoundError('Campaign not found');
  const { status: _s, recipientCount: _rc, totalBudget: _tb, entityId, ...rest } = patch;
  if (user?.scopeType === 'entity') {
    const allowed = (user.assignedEntityIds ?? []).map(String);
    const nextEntityId = entityId != null ? String(entityId) : String(campaign.entityId);
    const canAccess =
      allowed.includes(String(campaign.entityId)) || allowed.includes(nextEntityId);
    if (!canAccess) throw new ForbiddenError();
  }
  if (entityId !== undefined && String(entityId) !== String(campaign.entityId)) {
    if (!INCOMPLETE_CAMPAIGN_STATUSES.includes(campaign.status)) {
      throw new ApiError(422, 'Cannot change budget source after launch', 'CAMPAIGN_LOCKED');
    }
    const entity = await Entity.findOne({ _id: entityId, tenantId });
    if (!entity) throw new NotFoundError('Entity not found');
    assertEntityAccess(user, entity._id);
    campaign.entityId = entityId;
  }
  Object.assign(campaign, rest);
  await campaign.save();
  return withCampaignMeta(campaign);
}

/** Save or update an incomplete points send wizard draft. */
export async function savePointsDraft({ tenantId, userId, user, data }) {
  const entity = await Entity.findOne({ _id: data.entityId, tenantId });
  if (!entity) throw new NotFoundError('Entity not found');
  assertEntityAccess(user, entity._id);

  const shop = await Shop.findOne({ _id: data.shopId, tenantId });
  if (!shop) throw new NotFoundError('Shop not found');

  let campaign;
  if (data.campaignId) {
    campaign = await Campaign.findOne({ _id: data.campaignId, tenantId });
    if (!campaign) throw new NotFoundError('Campaign not found');
    if (!INCOMPLETE_CAMPAIGN_STATUSES.includes(campaign.status)) {
      throw new ApiError(422, 'Only incomplete campaigns can be saved as drafts', 'CAMPAIGN_LOCKED');
    }
    if (String(campaign.shopId) !== String(data.shopId)) throw new ForbiddenError();
    if (campaign.type !== 'points') {
      throw new ApiError(422, 'Only points campaigns support wizard drafts', 'INVALID_CAMPAIGN_TYPE');
    }
  } else {
    campaign = await Campaign.create({
      tenantId,
      entityId: data.entityId,
      name: data.name,
      type: 'points',
      shopId: data.shopId,
      pointsScope: data.pointsScope ?? 'shop',
      message: data.message ?? {},
      schedule: data.schedule ?? { mode: 'now' },
      createdBy: userId,
      status: 'draft',
    });
  }

  campaign.name = data.name;
  campaign.pointsScope = data.pointsScope ?? campaign.pointsScope;
  campaign.creditsPerRecipient = data.creditsPerRecipient ?? 0;
  if (data.message) {
    campaign.message = { ...campaign.message, ...data.message };
  }
  if (data.schedule) {
    campaign.schedule = { ...campaign.schedule, ...data.schedule };
  }
  if (data.draftState) {
    const prev = campaign.draftState?.toObject?.() ?? campaign.draftState ?? {};
    campaign.draftState = { ...prev, ...data.draftState };
  }

  const plannedRecips = Number(
    data.draftState?.recips ?? campaign.draftState?.recips ?? 0,
  );
  const selectedRecips = data.draftState?.selRecips?.length ?? campaign.draftState?.selRecips?.length ?? 0;

  await campaign.save();

  if (data.recipients?.length) {
    await upsertRecipientsFromList({ tenantId, campaign, rows: data.recipients });
    const uploadedCount = await Recipient.countDocuments({ tenantId, campaignId: campaign._id });
    campaign.recipientCount = plannedRecips > 0 ? plannedRecips : Math.max(uploadedCount, selectedRecips);
    if (campaign.status === 'draft') {
      transitionState('campaign', campaign, 'recipients_uploaded', { userId: user.userId });
    }
    await campaign.save();
  } else {
    campaign.recipientCount = plannedRecips > 0 ? plannedRecips : selectedRecips;
    await campaign.save();
  }

  return withCampaignMeta(campaign);
}

export async function deleteCampaign({ tenantId, campaignId, user }) {
  const campaign = await Campaign.findOne({ _id: campaignId, tenantId });
  if (!campaign) throw new NotFoundError('Campaign not found');
  if (user?.scopeType === 'entity') {
    const allowed = (user.assignedEntityIds ?? []).map(String);
    if (!allowed.includes(String(campaign.entityId))) throw new ForbiddenError();
  }
  if (!INCOMPLETE_CAMPAIGN_STATUSES.includes(campaign.status)) {
    throw new ApiError(422, 'Only incomplete campaigns can be deleted', 'CAMPAIGN_LOCKED');
  }

  // Incomplete drafts are permanently removed — nothing launched yet to retain for audit.
  await Recipient.deleteMany({ tenantId, campaignId: campaign._id });
  await Campaign.deleteOne({ _id: campaignId, tenantId });

  return { ok: true };
}

async function upsertRecipientsFromList({ tenantId, campaign, rows }) {
  const created = [];
  for (const row of rows) {
    let contactId = row.contactId ?? null;
    if (!contactId && row.email) {
      const contact = await Contact.findOne({ tenantId, email: row.email.toLowerCase() });
      contactId = contact?._id ?? null;
    }
    const recipient = await Recipient.findOneAndUpdate(
      { tenantId, campaignId: campaign._id, email: row.email.toLowerCase() },
      {
        $set: {
          name: row.name,
          phone: row.phone ?? '',
          contactId,
          creditAmount: row.creditAmount ?? campaign.creditsPerRecipient ?? 0,
          variants: row.variants,
        },
        $setOnInsert: {
          tenantId,
          campaignId: campaign._id,
          redemptionToken: nanoid(32),
          redemptionStatus: 'invited',
          invitedAt: new Date(),
        },
      },
      { upsert: true, new: true },
    );
    created.push(recipient);
  }
  return created;
}

/** §7.8 — CSV or manual recipient list. */
export async function importRecipients({ tenantId, campaignId, user, recipients, totalBudget }) {
  const campaign = await Campaign.findOne({ _id: campaignId, tenantId });
  if (!campaign) throw new NotFoundError('Campaign not found');
  if (user?.scopeType === 'entity') {
    const allowed = (user.assignedEntityIds ?? []).map(String);
    if (!allowed.includes(String(campaign.entityId))) throw new ForbiddenError();
  }
  if (!['draft', 'recipients_uploaded'].includes(campaign.status)) {
    throw new ApiError(422, 'Recipients cannot be changed after credits are allocated', 'CAMPAIGN_LOCKED');
  }

  const rows = await upsertRecipientsFromList({ tenantId, campaign, rows: recipients });
  campaign.recipientCount = await Recipient.countDocuments({ tenantId, campaignId: campaign._id });
  if (campaign.status === 'draft') {
    transitionState('campaign', campaign, 'recipients_uploaded', { userId: user.userId });
  }
  // Kit / items sends skip credit allocation — approve once recipients are uploaded.
  if (['kit', 'items'].includes(campaign.type) && campaign.status === 'recipients_uploaded') {
    campaign.creditsPerRecipient = 0;
    const budget = Math.round(totalBudget ?? 0);
    if (budget > 0) {
      await assertWalletCanSpend({
        tenantId,
        entityId: campaign.entityId,
        amount: budget,
        user,
      });
      campaign.totalBudget = budget;
    } else {
      campaign.totalBudget = 0;
    }
    transitionState('campaign', campaign, 'credits_allocated', { userId: user.userId });
    transitionState('campaign', campaign, 'approved', { userId: user.userId });
  }
  await campaign.save();
  return { count: rows.length, campaign: withCampaignMeta(campaign) };
}

export async function allocateCredits({
  tenantId,
  campaignId,
  user,
  creditsPerRecipient,
  totalBudget: totalBudgetOverride,
}) {
  const campaign = await Campaign.findOne({ _id: campaignId, tenantId });
  if (!campaign) throw new NotFoundError('Campaign not found');
  if (user?.scopeType === 'entity') {
    const allowed = (user.assignedEntityIds ?? []).map(String);
    if (!allowed.includes(String(campaign.entityId))) throw new ForbiddenError();
  }

  const count = await Recipient.countDocuments({ tenantId, campaignId: campaign._id });
  if (count === 0) throw new ApiError(422, 'Upload recipients before allocating credits', 'NO_RECIPIENTS');

  const totalBudget = Math.round(totalBudgetOverride ?? creditsPerRecipient * count);
  await assertWalletCanSpend({
    tenantId,
    entityId: campaign.entityId,
    amount: totalBudget,
    user,
  });
  const entity = await Entity.findOne({ _id: campaign.entityId, tenantId });
  if (user?.scopeType === 'entity') {
    const entityAvailable = entity.allocatedAmount - entity.spentAmount;
    if (totalBudget > entityAvailable) {
      throw new ApiError(
        422,
        `Total budget ₹${totalBudget} exceeds entity available budget ₹${entityAvailable}`,
        'INSUFFICIENT_ENTITY_BUDGET',
      );
    }
  }

  campaign.creditsPerRecipient = creditsPerRecipient;
  campaign.recipientCount = count;
  campaign.totalBudget = totalBudget;
  await Recipient.updateMany({ tenantId, campaignId: campaign._id }, { creditAmount: creditsPerRecipient });

  if (campaign.status === 'recipients_uploaded') {
    transitionState('campaign', campaign, 'credits_allocated', { userId: user.userId });
    transitionState('campaign', campaign, 'approved', { userId: user.userId });
  }
  await campaign.save();
  return withCampaignMeta(campaign);
}

/** §7.8 /launch — idempotent wallet debit + invite notifications. */
export async function launchCampaign({ tenantId, campaignId, user }) {
  const campaign = await Campaign.findOne({ _id: campaignId, tenantId });
  if (!campaign) throw new NotFoundError('Campaign not found');
  if (user?.scopeType === 'entity') {
    const allowed = (user.assignedEntityIds ?? []).map(String);
    if (!allowed.includes(String(campaign.entityId))) throw new ForbiddenError();
  }
  if (campaign.status === 'launched' || campaign.status === 'redemption_open') {
    return withCampaignMeta(campaign);
  }
  if (campaign.status !== 'approved') {
    throw new ApiError(422, 'Campaign must be approved before launch', 'CAMPAIGN_NOT_APPROVED');
  }

  const entity = await Entity.findOne({ _id: campaign.entityId, tenantId });
  const { wallet } = await ledger.resolveSpendWalletForEntity({
    tenantId,
    entityId: campaign.entityId,
  });
  const isFulfillment = campaign.type === 'kit' || campaign.type === 'items';
  const spendFromEntity = user?.scopeType === 'entity';
  if (campaign.totalBudget > 0) {
    await ledger.createTransaction({
      tenantId,
      walletId: wallet._id,
      type: 'campaign_spend',
      amount: -campaign.totalBudget,
      relatedEntityId: spendFromEntity ? entity._id : null,
      description: `Campaign launch: ${campaign.name}`,
      performedBy: user.userId,
    });
  }

  transitionState('campaign', campaign, 'launched', { userId: user.userId });
  transitionState('campaign', campaign, 'redemption_open', { userId: user.userId });

  if (campaign.fulfillmentMode === 'surprise') {
    if (!isFulfillment) {
      throw new ApiError(422, 'Surprise fulfillment is only available for item and kit sends', 'SURPRISE_NOT_SUPPORTED');
    }
    const { createSurpriseOrdersForCampaign } = await import('../redemptions/redemptions.service.js');
    await createSurpriseOrdersForCampaign({ tenantId, campaign });
  }
  if (campaign.fulfillmentMode === 'single') {
    if (!isFulfillment) {
      throw new ApiError(422, 'Single-location fulfillment is only available for item and kit sends', 'SINGLE_NOT_SUPPORTED');
    }
    const { createSingleLocationOrderForCampaign } = await import('../redemptions/redemptions.service.js');
    await createSingleLocationOrderForCampaign({ tenantId, campaign });
  }

  await campaign.save();
  recordUsage(tenantId, 'campaigns.launched'); // §Gap E metering

  const scheduleMode = campaign.schedule?.mode ?? 'now';
  const sendInvites = scheduleMode === 'now';
  const fromLabel = campaign.message?.from?.trim() || campaign.name;
  const isSurprise = campaign.fulfillmentMode === 'surprise';
  const isSingle = campaign.fulfillmentMode === 'single';
  const inviteBody =
    campaign.message?.body?.trim() ||
    (isSurprise
      ? `${fromLabel} is sending you a surprise gift. No action is required from you.`
      : isFulfillment
        ? 'Choose your gift using the link below.'
        : 'Redeem your gift using the link we sent.');
  const inviteTitle = isSurprise
    ? `You've received a gift from ${fromLabel}!`
    : isFulfillment
      ? `${fromLabel} sent you a gift`
      : `You're invited: ${campaign.name}`;

  if (sendInvites) {
    const [tenant, kit, shop] = await Promise.all([
      Tenant.findById(tenantId).select('name').lean(),
      campaign.kitId ? Kit.findOne({ _id: campaign.kitId, tenantId }).select('name').lean() : null,
      campaign.shopId
        ? Shop.findOne({ _id: campaign.shopId, tenantId })
          .select('name logoUrl bannerConfig currencyMode')
          .lean()
        : null,
    ]);
    const companyName = tenant?.name || 'your company';
    const giftName = campaign.type === 'points' ? `${shop?.name || campaign.name} points` : (kit?.name || campaign.name);
    if (isSingle) {
      await notify({
        type: 'single_location_gift',
        tenantId,
        email: campaign.singleLocation.email,
        title: `${companyName} is sending gifts to ${campaign.singleLocation.name}`,
        body: `${campaign.recipientCount} gift${campaign.recipientCount === 1 ? '' : 's'} will be shipped to the provided address.`,
      });
    } else {
      const recipients = await Recipient.find({ tenantId, campaignId: campaign._id });
      for (const r of recipients) {
        await notify({
          type: isSurprise ? 'surprise_gift' : 'redemption_invite',
          tenantId,
          email: r.email,
          phone: r.phone || null,
          title: inviteTitle,
          body: inviteBody,
          link: isSurprise ? '' : `/redeem/${r.redemptionToken}`,
          meta: {
            recipientName: r.name,
            senderName: fromLabel,
            message: inviteBody,
            giftName,
            companyName,
            campaignType: campaign.type,
            fulfillmentMode: campaign.fulfillmentMode,
            pointsScope: campaign.pointsScope ?? 'shop',
            shopName: shop?.name ?? '',
            shopLogoUrl: shop?.logoUrl ?? '',
            shopBannerTheme: shop?.bannerConfig?.theme ?? '',
            shopBannerPreset: shop?.bannerConfig?.preset ?? '',
            shopCurrencyMode: shop?.currencyMode ?? 'points',
          },
        });
      }
    }
  }

  if (campaign.kitId) {
    await Kit.updateOne({ _id: campaign.kitId, tenantId }, { lastSentAt: new Date() });
  }
  if (entity.managerUserId) {
    await notify({
      type: 'campaign_launched',
      tenantId,
      userId: entity.managerUserId,
      title: `Campaign launched: ${campaign.name}`,
      body: isSurprise
        ? `${campaign.recipientCount} surprise gift orders created.`
        : isSingle
          ? `One delivery order created for ${campaign.recipientCount} recipients.`
        : `${campaign.recipientCount} recipients invited.`,
      link: `/campaigns/${campaign._id}`,
    });
  }

  return withCampaignMeta(campaign);
}

export async function closeCampaign({ tenantId, campaignId, user }) {
  const campaign = await Campaign.findOne({ _id: campaignId, tenantId });
  if (!campaign) throw new NotFoundError('Campaign not found');
  assertEntityAccess(user, campaign.entityId);
  transitionState('campaign', campaign, 'redemption_closed', { userId: user.userId });
  await campaign.save();
  return withCampaignMeta(campaign);
}

export async function campaignReport({ tenantId, campaignId, user }) {
  await getCampaign({ tenantId, campaignId, user });
  const recipients = await Recipient.find({ tenantId, campaignId }).select(
    'name email creditAmount redemptionStatus openedAt verifiedAt redeemedAt',
  );
  return { recipients };
}

export { transitionRedemption, finalizeRecipientRedemption };
