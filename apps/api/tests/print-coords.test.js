import { describe, it, expect } from 'vitest';
import {
  DEFAULT_DPI,
  DEFAULT_PHYSICAL,
  inchesToPrintPixels,
  normalizePlaceholder,
  physicalFrameStageRect,
  placeholderToStagePixels,
  placementPrintFractions,
  printExportSize,
  stagePixelsToArtworkPlacement,
} from '../src/lib/printCoords.js';

describe('printCoords inch foundation', () => {
  it('maps 1×1 in as 1/phys of the displayed image on each axis', () => {
    const phys = { width: 20, height: 24 };
    const frame = physicalFrameStageRect(phys, {
      imageNaturalWidth: 1000,
      imageNaturalHeight: 1000,
    });
    const stage = placeholderToStagePixels(
      { xIn: 0, yIn: 0, widthIn: 1, heightIn: 1, scale: 1 },
      phys,
      { imageNaturalWidth: 1000, imageNaturalHeight: 1000 },
    );
    expect(stage.w / frame.frameW).toBeCloseTo(1 / 20, 5);
    expect(stage.h / frame.frameH).toBeCloseTo(1 / 24, 5);
  });

  it('keeps a square inch square when product AR matches image AR', () => {
    const phys = { width: 20, height: 20 };
    const stage = placeholderToStagePixels(
      { xIn: 0, yIn: 0, widthIn: 1, heightIn: 1, scale: 1 },
      phys,
      { imageNaturalWidth: 800, imageNaturalHeight: 800 },
    );
    expect(Math.abs(stage.w - stage.h)).toBeLessThan(0.001);
  });

  it('maps typed 3.1×3.1 in as fractions of the displayed mockup', () => {
    const phys = DEFAULT_PHYSICAL;
    const frame = physicalFrameStageRect(phys);
    const stage = placeholderToStagePixels(
      { xIn: 5, yIn: 5, widthIn: 3.1, heightIn: 3.1 },
      phys,
    );
    expect(stage.w / frame.frameW).toBeCloseTo(3.1 / phys.width, 5);
    expect(stage.h / frame.frameH).toBeCloseTo(3.1 / phys.height, 5);
  });

  it('maps inches onto the displayed mockup image, not a shrunk product frame', () => {
    const phys = { width: 20, height: 24 };
    // Square mockup contained in 720×520 → 520×520 centered.
    const frame = physicalFrameStageRect(phys, {
      imageNaturalWidth: 1000,
      imageNaturalHeight: 1000,
    });
    expect(frame.frameW).toBeCloseTo(520, 5);
    expect(frame.frameH).toBeCloseTo(520, 5);
    const threeHalf = placeholderToStagePixels(
      { xIn: 0, yIn: 0, widthIn: 3.5, heightIn: 3.5 },
      phys,
      { imageNaturalWidth: 1000, imageNaturalHeight: 1000 },
    );
    // 3.5 / 20 of the displayed image width.
    expect(threeHalf.w / frame.frameW).toBeCloseTo(3.5 / 20, 5);
    expect(threeHalf.h / frame.frameH).toBeCloseTo(3.5 / 24, 5);
  });

  it('exports print pixels as round(inches × dpi), not editor px', () => {
    const { widthPx, heightPx } = printExportSize(3.1, 3.1, 300);
    expect(widthPx).toBe(930);
    expect(heightPx).toBe(930);
    expect(inchesToPrintPixels(3.1, DEFAULT_DPI)).toBe(930);
  });

  it('lockSize visual scale does not change export inches', () => {
    const phys = DEFAULT_PHYSICAL;
    const base = placeholderToStagePixels(
      { xIn: 4, yIn: 4, widthIn: 3.1, heightIn: 3.1, scale: 1 },
      phys,
    );
    const scaled = placeholderToStagePixels(
      { xIn: 4, yIn: 4, widthIn: 3.1, heightIn: 3.1, scale: 1.5 },
      phys,
    );
    expect(scaled.w / base.w).toBeCloseTo(1.5, 5);
    expect(printExportSize(3.1, 3.1, 300).widthPx).toBe(930);
  });

  it('normalizes legacy % boxes into inches', () => {
    const n = normalizePlaceholder(
      { box: { xPct: 25, yPct: 30, widthPct: 50, heightPct: 40 }, label: 'Front' },
      { width: 20, height: 24 },
    );
    expect(n.widthIn).toBe(10);
    expect(n.heightIn).toBe(9.6);
    expect(n.xIn).toBe(5);
    expect(n.box.widthPct).toBeGreaterThan(0);
  });

  it('stores artwork placement relative to the print area', () => {
    const printStage = { x: 100, y: 80, w: 200, h: 160 };
    const pl = stagePixelsToArtworkPlacement(200, 160, 100, 15, printStage);
    expect(pl.printCxPct).toBe(50);
    expect(pl.printCyPct).toBe(50);
    expect(pl.printWPct).toBe(50);
    expect(pl.rot).toBe(15);
    const frac = placementPrintFractions(pl, printStage);
    expect(frac.cx).toBeCloseTo(0.5, 5);
    expect(frac.w).toBeCloseTo(0.5, 5);
  });
});
