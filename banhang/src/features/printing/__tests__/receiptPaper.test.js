import { describe, expect, it } from 'vitest';
import { getReceiptPaper } from '../receipt/receiptPaper.js';

describe('getReceiptPaper', () => {
  it('uses the 58 mm and 80 mm presets', () => {
    expect(getReceiptPaper({ receiptPaper: '58mm' })).toEqual({
      roll: true,
      widthMm: 58,
      marginMm: 5,
      printableMm: 48,
    });
    expect(
      getReceiptPaper({ receiptPaper: '80mm', receiptWidthMm: 60 })
    ).toEqual({ roll: true, widthMm: 80, marginMm: 4, printableMm: 72 });
  });

  it('uses the stored width and margin for custom paper (clamped)', () => {
    expect(
      getReceiptPaper({
        receiptPaper: 'custom',
        receiptWidthMm: 76,
        receiptMarginMm: 3,
      })
    ).toEqual({ roll: true, widthMm: 76, marginMm: 3, printableMm: 70 });
    expect(
      getReceiptPaper({
        receiptPaper: 'custom',
        receiptWidthMm: 500,
        receiptMarginMm: 50,
      })
    ).toEqual({ roll: true, widthMm: 112, marginMm: 10, printableMm: 92 });
  });

  it('is not a roll for auto (A5/A4) or missing settings', () => {
    expect(getReceiptPaper({ receiptPaper: 'auto' })).toMatchObject({
      roll: false,
      widthMm: 58,
      printableMm: 48,
    });
    expect(getReceiptPaper().roll).toBe(false);
    expect(getReceiptPaper(null).roll).toBe(false);
  });
});
