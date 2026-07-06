/** URL-safe shop slug from display name (e.g. "XYZ com" → "xyz-com"). */
export function slugifyShopName(name) {
  const base = String(name ?? '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48);
  return base || 'shop';
}

export async function ensureUniqueShopSlug(Shop, base, excludeId = null) {
  let slug = slugifyShopName(base);
  let n = 0;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const filter = { slug };
    if (excludeId) filter._id = { $ne: excludeId };
    // Slugs are globally unique (vanity URLs); skip tenant guard for existence checks.
    const exists = await Shop.findOne(filter).setOptions({
      includeDeleted: true,
      skipTenantGuard: true,
    });
    if (!exists) return slug;
    n += 1;
    slug = `${slugifyShopName(base).slice(0, 40)}-${n}`;
  }
}
