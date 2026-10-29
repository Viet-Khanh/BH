import { describe, expect, it } from 'vitest';
import { getSalesPrintButtons } from '../domain/salesPrintButtons.js';

const labels = { label: 'In', a4Label: 'In A4', singleLabel: 'In A4' };

describe('getSalesPrintButtons', () => {
  it('offers the roll receipt and a one-off A4 on roll paper', () => {
    expect(getSalesPrintButtons({ receiptPaper: '58mm' }, labels)).toEqual([
      { format: 'default', label: 'In' },
      { format: 'a4', label: 'In A4' },
    ]);
    expect(
      getSalesPrintButtons({ receiptPaper: 'custom' }, labels)
    ).toHaveLength(2);
  });

  it('keeps one button when the paper is already A5/A4', () => {
    expect(getSalesPrintButtons({ receiptPaper: 'auto' }, labels)).toEqual([
      { format: 'default', label: 'In A4' },
    ]);
    expect(getSalesPrintButtons(null, { label: 'IN LẠI' })).toEqual([
      { format: 'default', label: 'IN LẠI' },
    ]);
  });

  it('uses the default labels', () => {
    expect(getSalesPrintButtons({ receiptPaper: '80mm' })).toEqual([
      { format: 'default', label: 'In' },
      { format: 'a4', label: 'In A4' },
    ]);
  });
});
