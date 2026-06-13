import { PlatformSetting, PLATFORM_SETTING_DEFAULTS } from './platformSetting.model.js';

export async function getSetting(key) {
  const doc = await PlatformSetting.findOne({ key }).lean();
  if (doc) return doc.value;
  return PLATFORM_SETTING_DEFAULTS[key] ?? null;
}

export async function getAllSettings() {
  const docs = await PlatformSetting.find({}).lean();
  const overrides = Object.fromEntries(docs.map((d) => [d.key, d.value]));
  return { ...PLATFORM_SETTING_DEFAULTS, ...overrides };
}

export async function setSetting(key, value, userId = null) {
  const doc = await PlatformSetting.findOneAndUpdate(
    { key },
    { value, updatedByUserId: userId },
    { new: true, upsert: true },
  );
  return doc;
}
