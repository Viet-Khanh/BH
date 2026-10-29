import { describe, expect, it } from 'vitest';
import {
  computeBarcodeLayout,
  estimateBarcodeModules,
  getBarcodeAvailableMm,
  getQuietZones,
  isBarcodeTooLong,
} from '../labels/barcodeLayout.js';

describe('getQuietZones', () => {
  it('uses 11/7 modules for EAN-13 and 10/10 for Code128', () => {
    expect(getQuietZones('EAN13')).toEqual([11, 7]);
    expect(getQuietZones('CODE128')).toEqual([10, 10]);
    expect(getQuietZones('other')).toEqual([10, 10]);
  });
});

describe('estimateBarcodeModules', () => {
  it('counts EAN-13 as 95 modules plus quiet zones', () => {
    expect(estimateBarcodeModules('8934588012228', 'EAN13')).toBe(113);
  });

  it('counts Code128 set B: 11 per char + start/check/stop + quiet zones', () => {
    expect(estimateBarcodeModules('SP001', 'CODE128')).toBe(11 * 8 + 2 + 20);
    expect(estimateBarcodeModules('', 'CODE128')).toBe(55);
  });
});

describe('computeBarcodeLayout', () => {
  it('rounds the module down to whole dots', () => {
    expect(
      computeBarcodeLayout({ totalModules: 113, availableMm: 33 })
    ).toEqual({ moduleMm: 0.25, widthMm: 28.25, tooSmall: false });
  });

  it('flags symbols that only fit with 1-dot modules', () => {
    const layout = computeBarcodeLayout({ totalModules: 200, availableMm: 33 });
    expect(layout).toEqual({ moduleMm: 0.125, widthMm: 25, tooSmall: true });
  });

  it('never goes below one dot, even when the symbol overflows', () => {
    const layout = computeBarcodeLayout({ totalModules: 400, availableMm: 33 });
    expect(layout.moduleMm).toBe(0.125);
    expect(layout.widthMm).toBe(50);
    expect(layout.tooSmall).toBe(true);
  });

  it('supports other printer resolutions', () => {
    const layout = computeBarcodeLayout({
      totalModules: 113,
      availableMm: 33,
      dotsPerMm: 12,
    });
    expect(layout.moduleMm).toBeCloseTo(3 / 12);
    expect(layout.tooSmall).toBe(false);
  });
});

describe('isBarcodeTooLong', () => {
  it('checks the estimate against the label width minus padding', () => {
    expect(getBarcodeAvailableMm(35)).toBe(33);
    expect(isBarcodeTooLong('8934588012228', 'EAN13', 35)).toBe(false);
    expect(isBarcodeTooLong('SP001', 'CODE128', 35)).toBe(false);
    expect(isBarcodeTooLong('SP-0000000001', 'CODE128', 35)).toBe(true);
    expect(isBarcodeTooLong('SP-0000000001', 'CODE128', 60)).toBe(false);
  });
});
