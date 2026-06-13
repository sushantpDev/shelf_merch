import mongoose from 'mongoose';

// §3.3 — platform-curated kit bundles (distinct from tenant-scoped Kit drafts).
const platformKitSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    packaging: { type: String, enum: ['none', 'box', 'premium_box'], default: 'box' },
    eligibleCampaignTypes: { type: [String], default: [] },
    approxValueInr: { type: Number, default: 0 },
    imageUrls: { type: [String], default: [] },
    items: [
      {
        catalogProductId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'CatalogProduct',
          required: true,
        },
        variantSku: { type: String, default: '' },
        qty: { type: Number, default: 1 },
      },
    ],
    status: { type: String, enum: ['draft', 'active', 'archived'], default: 'draft' },
  },
  { timestamps: true },
);

export const PlatformKit = mongoose.model('PlatformKit', platformKitSchema);
