import { describe, expect, it } from 'vitest';
import { readPrintSettings } from '../domain/printSettings.js';
import {
  buildSampleDocumentHtml,
  buildSampleLabelRows,
  buildSampleReceiptData,
  buildSampleReceiptHtml,
} from '../domain/printSamples.js';
import { getReceiptAmounts } from '../receipt/receiptAmounts.js';

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

  it('prints at the chosen paper width with ready-made assets', () => {
    const layout = { blocks: [{ key: 'barcode', on: true }] };
    const html = buildSampleReceiptHtml(
      { receiptPaper: '80mm', receiptLayout: layout },
      { barcodeSvg: '<svg id="bc"></svg>' }
    );
    expect(html).toContain('width: 72mm');
    expect(html).toContain('<svg id="bc"></svg>');
  });

  it('leaves an amount due so the VietQR block can be tried', () => {
    const { invoice, payments } = buildSampleReceiptData({ shopName: 'X' });
    expect(getReceiptAmounts(invoice, payments).due).toBeGreaterThan(0);
  });
});

describe('buildSampleDocumentHtml', () => {
  it('fills the shop invoice template with the sample sale', () => {
    const html = buildSampleDocumentHtml({
      shopName: 'Tạp hoá An',
      invoiceTemplateHtml:
        '<h1>{{shop.name}}</h1><p>{{invoice.code}}</p>{{items}}',
    });
    expect(html).toContain('<h1>Tạp hoá An</h1>');
    expect(html).toContain('INV-20240101-001');
    expect(html).toContain('Hàng mẫu');
  });

  it('falls back to the default template', () => {
    const html = buildSampleDocumentHtml({ shopName: 'Tạp hoá An' });
    expect(html).toContain('@page { size: A4');
    expect(html).toContain('Tạp hoá An');
  });
});
