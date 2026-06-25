import mongoose from 'mongoose';

export const CHAT_SESSION_STATUSES = ['active', 'handed_off', 'closed'];

const historyEntrySchema = new mongoose.Schema(
  {
    sender: { type: String, enum: ['bot', 'user'], required: true },
    text: { type: String, required: true },
    nodeId: { type: String, default: null },
    timestamp: { type: Date, default: Date.now },
  },
  { _id: false },
);

const chatSessionSchema = new mongoose.Schema(
  {
    sessionId: { type: String, required: true, unique: true, trim: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    currentNodeId: { type: String, required: true, default: 'welcome' },
    history: { type: [historyEntrySchema], default: [] },
    status: { type: String, enum: CHAT_SESSION_STATUSES, default: 'active' },
  },
  { timestamps: true },
);

chatSessionSchema.index({ userId: 1, updatedAt: -1 });

export const ChatSession = mongoose.model('ChatSession', chatSessionSchema);
