# Print coordinate systems

Physical **inches** are the source of truth for print areas. Editor pixels and production pixels are always derived.

## Layers

| Space | Unit | Role |
|-------|------|------|
| Product frame | inches | `physicalDimensions` `{ width, height, length? }` — defaults 20×24, length 18 for side views |
| Placeholder | inches | `xIn, yIn, widthIn, heightIn, rotationDeg` (+ optional visual `scale`, `lockSize`) |
| Editor stage | px | Fixed `800×600` canvas with `40px` padding → effective `720×520` |
| Print asset | px | `round(widthIn × dpi) × round(heightIn × dpi)` — default DPI 300 |
| Mockup bitmap | px | Same inch→px mapping relative to mockup image + physical frame |

## Shared formulas

```
# Mockup image displays at normal object-fit:contain size (never shrunk by Product W/H).
imageRect = contain(imageNaturalSize into padded canvas)

# Product W/H = real-world size of that full image. Inches map onto it:
pxPerInchX = imageRect.w / physicalWidth
pxPerInchY = imageRect.h / physicalHeight

stageX = imageRect.x + xIn × pxPerInchX
stageY = imageRect.y + yIn × pxPerInchY
stageW = widthIn × pxPerInchX × (scale || 1)
stageH = heightIn × pxPerInchY × (scale || 1)

exportW = round(widthIn × dpi)
exportH = round(heightIn × dpi)
```

**Mockup W/H ≠ print area.** Set Mockup W/H to the real-world size of the **entire photo** (including background), not the shirt alone.

| Mockup type | Typical Mockup W×H | Notes |
|-------------|-------------------|--------|
| Flat garment filling the frame | 20×24 | Default |
| Lifestyle / model photo | ~48×60 | Shirt is only part of the image; use the **Lifestyle** preset or 4.5″ looks huge |

A 4.5″ print on an ~18″ adult chest should look ~25% of chest width. If it overflows the shoulder, raise Mockup W.

Module: `apps/web/src/lib/printCoords.ts` (web) and `apps/api/src/lib/printCoords.js` (API) — keep in sync.

## Artwork placement (designer)

Artwork position is stored **relative to the print area**, not the full editor canvas:

| Field | Meaning |
|-------|---------|
| `printCxPct` / `printCyPct` | Artwork center as % of print-area width/height |
| `printWPct` | Artwork width as % of print-area width |
| `xPct` / `yPct` / `wPct` | Mirrored canvas % for legacy CSS thumbs |

Production export (`exportDesignOnly`) draws onto a transparent canvas of `round(widthIn×dpi) × round(heightIn×dpi)` using those print-relative fractions. Collection refs also store `designOnlyImageUrl` + `printSpec`.

## Rules

1. **Never** persist print size as editor pixels or “% of image” as the source of truth. Legacy `box` % / `maxWidthCm` are derived or migrated.
2. **Lock print size**: transformer changes `scale` only; `widthIn`/`heightIn` and export size stay fixed.
3. **Preview ≠ production**: mockup bake / `devicePixelRatio` / `pixelRatio: 2` are preview quality. Production files use inches × DPI.
4. Changing `physicalDimensions` or `dpi` recalculates display / export size; stored inches stay until an admin edits them.
5. Prefer flat measured mockups when inch accuracy matters; Product W/H must be the full garment/view size, not the print plate.

## Example

A 3.1″ × 3.1″ placeholder at 300 DPI exports **930 × 930 px**, not ~134 editor pixels.
