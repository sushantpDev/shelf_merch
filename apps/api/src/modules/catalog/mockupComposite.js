/**
 * Server-side mockup composite helpers using inch geometry.
 * Production design assets are print-DPI PNGs; mockup placement uses the same
 * inch→pixel mapping as the editor (via printCoords.designPlacementOnMockup).
 */

import {
  DEFAULT_DPI,
  designPlacementOnMockup,
  normalizePlaceholder,
  printExportSize,
  resolvePhysical,
} from '../lib/printCoords.js';

/**
 * Compute where a design-only PNG sits on a mockup bitmap.
 * @param {object} args
 * @param {number} args.mockupWidthPx
 * @param {number} args.mockupHeightPx
 * @param {object} args.printArea - raw or normalized placeholder
 * @param {object} [args.physicalDimensions]
 * @param {string} [args.viewKey]
 */
export function resolveDesignRectOnMockup({
  mockupWidthPx,
  mockupHeightPx,
  printArea,
  physicalDimensions,
  viewKey,
}) {
  const phys = resolvePhysical(physicalDimensions);
  const ph = normalizePlaceholder(printArea, phys);
  return designPlacementOnMockup({
    mockupWidthPx,
    mockupHeightPx,
    placeholder: ph,
    physicalDimensions: phys,
    viewKey: viewKey || ph.key,
  });
}

/**
 * Expected production PNG pixel size for a print area.
 */
export function resolvePrintAssetSize(printArea, productDpi, physicalDimensions) {
  const phys = resolvePhysical(physicalDimensions);
  const ph = normalizePlaceholder(printArea, phys);
  const dpi = Math.max(1, Number(printArea?.dpi) || Number(productDpi) || DEFAULT_DPI);
  return {
    ...printExportSize(ph.widthIn, ph.heightIn, dpi),
    widthIn: ph.widthIn,
    heightIn: ph.heightIn,
    dpi,
  };
}

/**
 * Normalize all print areas on a product document (mutates a plain object copy).
 */
export function normalizeProductPrintAreas(product) {
  const phys = resolvePhysical(product?.physicalDimensions);
  const dpi = Math.max(1, Number(product?.dpi) || DEFAULT_DPI);
  const printAreas = Array.isArray(product?.printAreas)
    ? product.printAreas.map((a) => {
        const n = normalizePlaceholder(a, physicalFrameForKey(phys, a?.key));
        return { ...a, ...n, dpi: Math.max(1, Number(a?.dpi) || dpi) };
      })
    : [];
  return { physicalDimensions: phys, dpi, printAreas };
}

function physicalFrameForKey(phys, key) {
  const k = String(key || '').toLowerCase();
  if (k === 'left' || k === 'right' || k.includes('side')) {
    return { width: phys.length ?? 18, height: phys.height, length: phys.length };
  }
  return phys;
}
