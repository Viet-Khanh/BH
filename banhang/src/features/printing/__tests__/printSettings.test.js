import { describe, expect, it } from 'vitest';
import {
  getLabelRowSize,
  LABEL_PRESETS,
  PRINT_DEFAULT_SETTINGS,
  readPrintSettings,
  shouldAutoPrintLabels,
} from '../domain/printSettings.js';

describe('readPrintSettings', () => {
  it('fills defaults for missing fields', () => {
    expect(readPrintSettings()).toEqual(PRINT_DEFAULT_SETTINGS);
    expect(readPrintSettings({ shopName: 'X' })).toEqual(
      PRINT_DEFAULT_SETTINGS
    );
  });

  it('keeps valid values and trims strings', () => {
    const print = readPrintSettings({
      receiptPaper: '58mm',
      receiptPrinterName: '  XP-58  ',
      labelPrinterName: ' Xprinter 365B ',
      labelWidthMm: 40,
      labelHeightMm: 30,
      labelColumns: 1,
      labelGapMm: 0,
      labelOffsetXMm: -1.5,
      labelOffsetYMm: 2,
      labelShowShopName: false,
      labelShowPrice: false,
      autoPrintLabelsOnPurchase: false,
    });
    expect(print).toEqual({
      receiptPaper: '58mm',
      receiptPrinterName: 'XP-58',
      labelPrinterName: 'Xprinter 365B',
      labelWidthMm: 40,
      labelHeightMm: 30,
      labelColumns: 1,
      labelGapMm: 0,
      labelOffsetXMm: -1.5,
      labelOffsetYMm: 2,
      labelShowShopName: false,
      labelShowPrice: false,
      autoPrintLabelsOnPurchase: false,
    });
  });

  it('clamps numbers to sane ranges', () => {
    const print = readPrintSettings({
      labelWidthMm: 5,
      labelHeightMm: 500,
      labelColumns: 9,
      labelGapMm: 50,
      labelOffsetXMm: -30,
      labelOffsetYMm: 99,
    });
    expect(print).toMatchObject({
      labelWidthMm: 10,
      labelHeightMm: 120,
      labelColumns: 4,
      labelGapMm: 20,
      labelOffsetXMm: -10,
      labelOffsetYMm: 20,
    });
    expect(readPrintSettings({ labelColumns: 0 }).labelColumns).toBe(1);
    expect(readPrintSettings({ labelColumns: 2.6 }).labelColumns).toBe(3);
  });

  it('falls back to defaults for invalid values', () => {
    const print = readPrintSettings({
      receiptPaper: 'A7',
      receiptPrinterName: null,
      labelWidthMm: 'abc',
      labelHeightMm: null,
      labelShowPrice: undefined,
    });
    expect(print).toMatchObject({
      receiptPaper: 'auto',
      receiptPrinterName: '',
      labelWidthMm: 35,
      labelHeightMm: 22,
      labelShowPrice: true,
    });
  });
});

describe('getLabelRowSize', () => {
  it('sums columns and gaps', () => {
    expect(getLabelRowSize(PRINT_DEFAULT_SETTINGS)).toEqual({
      widthMm: 72,
      heightMm: 22,
    });
    expect(
      getLabelRowSize({
        labelColumns: 1,
        labelWidthMm: 50,
        labelGapMm: 2,
        labelHeightMm: 30,
      })
    ).toEqual({ widthMm: 50, heightMm: 30 });
  });
});

it('describes the label presets', () => {
  expect(LABEL_PRESETS.map((preset) => preset.value)).toEqual([
    '35x22x2',
    '40x30x1',
    '50x30x1',
  ]);
});

describe('shouldAutoPrintLabels', () => {
  it('needs the labels flag and the setting (default on)', () => {
    expect(shouldAutoPrintLabels({}, true)).toBe(true);
    expect(shouldAutoPrintLabels({}, false)).toBe(false);
    expect(
      shouldAutoPrintLabels({ autoPrintLabelsOnPurchase: false }, true)
    ).toBe(false);
  });
});
