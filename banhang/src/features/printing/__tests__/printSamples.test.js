import { describe, expect, it } from 'vitest';
import { readPrintSettings } from '../domain/printSettings.js';
import {
  buildSampleLabelRows,
  buildSampleReceiptHtml,
} from '../domain/printSamples.js';

describe('buildSampleLabelRows', () => {
  it('fills one row of labels with the sample product', () => {
    const [row] = buildSampleLabelRows(readPrintSettings({ labelColumns: 3 }));
    expect(row).toMatchObject({
      name: 'Hàng mẫu',
      price: 10000,
      barcode: 'TH001',
      barcodeFormat: 'CODE128',
      count: 3,
    });
  });
});

describe('buildSampleReceiptHtml', () => {
  it('prints the shop and sample lines', () => {
    const html = buildSampleReceiptHtml({ shopName: 'Tạp hoá An' });
    expect(html).toContain('Tạp hoá An');
    expect(html).toContain('Hàng mẫu');
    expect(html).toContain('Cảm ơn quý khách!');
  });
});
