import { describe, expect, it } from 'vitest';
import Settings from '../Settings.js';

describe('Settings model: roll receipt fields', () => {
  it('fills paper, layout, logo and bank defaults', () => {
    const doc = new Settings({ id: 'main' }).toObject();
    expect(doc).toMatchObject({
      receiptPaper: 'auto',
      receiptWidthMm: 58,
      receiptMarginMm: 5,
      receiptLogo: '',
      documentPrinterName: '',
      bankBin: '',
      bankAccountNo: '',
      bankAccountName: '',
    });
    expect(doc.receiptLayout.fontSizePx).toBe(12);
    expect(doc.receiptLayout.blocks.map((block) => block.key)).toEqual([
      'logo',
      'shop',
      'title',
      'meta',
      'customer',
      'items',
      'totals',
      'note',
      'qr',
      'barcode',
      'footer',
    ]);
  });

  it('keeps a stored layout object as is', () => {
    const receiptLayout = {
      fontSizePx: 14,
      blocks: [{ key: 'items', on: true, style: 'compact' }],
    };
    const doc = new Settings({ id: 'main', receiptLayout }).toObject();
    expect(doc.receiptLayout).toEqual(receiptLayout);
  });

  it('gives every document its own default layout', () => {
    const first = new Settings({ id: 'a' });
    const second = new Settings({ id: 'b' });
    expect(first.receiptLayout).not.toBe(second.receiptLayout);
  });
});
