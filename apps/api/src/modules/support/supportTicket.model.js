import mongoose from 'mongoose';
import { tenantScopePlugin } from '../../plugins/tenantScope.plugin.js';
import { softDeletePlugin } from '../../plugins/softDelete.plugin.js';

export const SUPPORT_TICKET_STATUSES = [
  'open',
  'in_progress',
  'waiting_on_customer',
  'resolved',
  'closed',
];

export const SUPPORT_TICKET_TYPES = [
  'delivery_issue',
  'address_change',
  'replacement',
  'redemption_issue',
  'billing',
  'other',
];

export const SUPPORT_TICKET_SOURCES = ['recipient', 'tenant', 'platform'];

const supportTicketSchema = new mongoose.Schema(
  {
    raisedByUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    subject: { type: String, required: true },
    description: { type: String, default: '' },
    type: { type: String, enum: SUPPORT_TICKET_TYPES, default: 'other' },
    source: { type: String, enum: SUPPORT_TICKET_SOURCES, default: 'tenant' },
    relatedOrderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', default: null },
    relatedRecipientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Recipient', default: null },
    status: { type: String, enum: SUPPORT_TICKET_STATUSES, default: 'open' },
    statusHistory: [{ status: String, at: Date, actorUserId: mongoose.Schema.Types.ObjectId, note: String }],
    assignedToUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    messages: [
      {
        authorUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
        body: { type: String, required: true },
        // Internal notes are platform-only and never shown to tenants/recipients.
        internal: { type: Boolean, default: false },
        at: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true },
);

supportTicketSchema.plugin(tenantScopePlugin);
supportTicketSchema.plugin(softDeletePlugin);
supportTicketSchema.index({ tenantId: 1, status: 1 });
supportTicketSchema.index({ assignedToUserId: 1, status: 1 });

export const SupportTicket = mongoose.model('SupportTicket', supportTicketSchema);
