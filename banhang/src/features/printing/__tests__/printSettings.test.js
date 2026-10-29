import { describe, expect, it } from 'vitest';
import { DEFAULT_RECEIPT_LAYOUT } from '../receipt/receiptLayout.js';
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
      receiptWidthMm: 76,
      receiptMarginMm: 3,
      receiptLayout: { fontSizePx: 14 },
      receiptLogo: 'data:image/png;base64,AAAA',
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
      printCopies: 1,
      receiptPaper: '58mm',
      receiptPrinterName: 'XP-58',
      receiptWidthMm: 76,
      receiptMarginMm: 3,
      receiptLayout: { ...DEFAULT_RECEIPT_LAYOUT, fontSizePx: 14 },
      receiptLogo: 'data:image/png;base64,AAAA',
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
      labelOffsetYMm: 10,
    });
    expect(readPrintSettings({ labelGapMm: -3 }).labelGapMm).toBe(0);
    expect(readPrintSettings({ receiptWidthMm: 20 }).receiptWidthMm).toBe(40);
    expect(readPrintSettings({ receiptWidthMm: 200 }).receiptWidthMm).toBe(112);
    expect(readPrintSettings({ receiptMarginMm: -1 }).receiptMarginMm).toBe(0);
    expect(readPrintSettings({ receiptMarginMm: 30 }).receiptMarginMm).toBe(10);
    expect(readPrintSettings({ labelColumns: 0 }).labelColumns).toBe(1);
    expect(readPrintSettings({ labelColumns: 2.6 }).labelColumns).toBe(3);
  });

  it('keeps print copies as a whole number from 1 to 10', () => {
    expect(readPrintSettings({ printCopies: 2 }).printCopies).toBe(2);
    expect(readPrintSettings({ printCopies: 0 }).printCopies).toBe(1);
    expect(readPrintSettings({ printCopies: 3.4 }).printCopies).toBe(3);
    expect(readPrintSettings({ printCopies: 50 }).printCopies).toBe(10);
  });

  it('accepts every roll paper', () => {
    ['auto', '58mm', '80mm', 'custom'].forEach((paper) =>
      expect(readPrintSettings({ receiptPaper: paper }).receiptPaper).toBe(
        paper
      )
    );
  });

  it('keeps only image data URLs as the receipt logo', () => {
    expect(
      readPrintSettings({ receiptLogo: 'https://x.test/a.png' }).receiptLogo
    ).toBe('');
    expect(readPrintSettings({ receiptLogo: 42 }).receiptLogo).toBe('');
  });

  it('falls back to defaults for invalid values', () => {
    const print = readPrintSettings({
      receiptPaper: 'A7',
      receiptWidthMm: 'wide',
      receiptLayout: 'x',
      receiptPrinterName: null,
      labelWidthMm: 'abc',
      labelHeightMm: null,
      labelShowPrice: undefined,
    });
    expect(print).toMatchObject({
      receiptPaper: 'auto',
      receiptPrinterName: '',
      receiptWidthMm: 58,
      receiptLayout: DEFAULT_RECEIPT_LAYOUT,
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
