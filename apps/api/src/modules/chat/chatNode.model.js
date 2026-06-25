import mongoose from 'mongoose';

export const CHAT_RESPONSE_TYPES = ['buttons', 'carousel', 'end'];

const chatOptionSchema = new mongoose.Schema(
  {
    label: { type: String, required: true },
    next: { type: String, default: '' },
    action: { type: String, default: '' },
  },
  { _id: false },
);

const carouselItemSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    linkUrl: { type: String, required: true },
    thumbnailUrl: { type: String, default: '' },
  },
  { _id: false },
);

const chatNodeSchema = new mongoose.Schema(
  {
    nodeId: { type: String, required: true, unique: true, trim: true },
    messages: { type: [String], required: true, default: [] },
    responseType: { type: String, enum: CHAT_RESPONSE_TYPES, required: true },
    options: { type: [chatOptionSchema], default: [] },
    carouselItems: { type: [carouselItemSchema], default: [] },
    showHumanHandoff: { type: Boolean, default: false },
    isEndNode: { type: Boolean, default: false },
  },
  { timestamps: true },
);

export const ChatNode = mongoose.model('ChatNode', chatNodeSchema);
