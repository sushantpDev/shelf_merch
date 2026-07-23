import { resolveMediaUrl } from "@/lib/mediaUrl";

export type PreviousArtwork = {
  id: string;
  name: string;
  preview: string;
  fileType: string;
};

const HISTORY_KEY = "swag-artwork-history";
const HISTORY_LIMIT = 24;

export function loadArtworkHistory(): PreviousArtwork[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as PreviousArtwork[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function rememberArtwork(item: PreviousArtwork) {
  const next = [
    item,
    ...loadArtworkHistory().filter((h) => h.preview !== item.preview),
  ].slice(0, HISTORY_LIMIT);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(next));
}

function fileTypeFromUrl(url: string) {
  const ext = url.split("?")[0].split(".").pop()?.toUpperCase();
  return ext && ext.length <= 5 ? ext : "PNG";
}

function labelFromUrl(url: string, fallback: string) {
  try {
    // Keep the extension — publish re-uploads previous artwork as a File and
    // the API allowlist requires both MIME and a matching extension.
    const file = url.split("?")[0].split("/").pop() || "";
    return decodeURIComponent(file) || fallback;
  } catch {
    return fallback;
  }
}

function sourceItems(
  collections: Array<{ id: string; name: string; artworkUrl?: string }>,
  kits: Array<{ id: string; name: string; artworkUrl?: string }>,
): PreviousArtwork[] {
  const rows: PreviousArtwork[] = [];
  for (const c of collections) {
    if (!c.artworkUrl) continue;
    const preview = resolveMediaUrl(c.artworkUrl) || c.artworkUrl;
    rows.push({
      id: `collection-${c.id}`,
      name: labelFromUrl(c.artworkUrl, c.name),
      preview,
      fileType: fileTypeFromUrl(c.artworkUrl),
    });
  }
  for (const k of kits) {
    if (!k.artworkUrl) continue;
    const preview = resolveMediaUrl(k.artworkUrl) || k.artworkUrl;
    rows.push({
      id: `kit-${k.id}`,
      name: labelFromUrl(k.artworkUrl, k.name),
      preview,
      fileType: fileTypeFromUrl(k.artworkUrl),
    });
  }
  return rows;
}

export function buildPreviousUploads(
  collections: Array<{ id: string; name: string; artworkUrl?: string }>,
  kits: Array<{ id: string; name: string; artworkUrl?: string }> = [],
): PreviousArtwork[] {
  const seen = new Set<string>();
  const merged = [...loadArtworkHistory(), ...sourceItems(collections, kits)];
  return merged.filter((item) => {
    if (!item.preview || seen.has(item.preview)) return false;
    seen.add(item.preview);
    return true;
  });
}
