import { describe, expect, it } from 'vitest';
import { buildSalesPrintJob } from '../printSalesInvoice.js';

const base = {
  invoice: { code: 'HD1', date: '2026-10-29', total: 1000, items: [] },
  products: [],
  customer: null,
  payments: [{ amount: 1000 }],
  buildHtml: () => '<p>a5</p>',
};

describe('buildSalesPrintJob', () => {
  it('uses the 58 mm receipt on the receipt printer', () => {
    const job = buildSalesPrintJob({
      ...base,
      settings: {
        receiptPaper: '58mm',
        receiptPrinterName: 'XP-58',
        printCopies: 2,
      },
    });
    expect(job.html).toContain('HOÁ ĐƠN BÁN HÀNG');
    expect(job.options).toEqual({
      copies: 2,
      deviceName: 'XP-58',
      autoHeightWidthMm: 58,
    });
  });

  it('keeps the normal template otherwise', () => {
    const job = buildSalesPrintJob({
      ...base,
      settings: { receiptPaper: 'auto' },
      copies: 1,
    });
    expect(job).toEqual({
      html: '<p>a5</p>',
      options: { copies: 1, autoPageSize: true },
    });
  });

  it('returns null when there is nothing to print', () => {
    expect(buildSalesPrintJob({ ...base, settings: null })).toBeNull();
    expect(
      buildSalesPrintJob({
        ...base,
        settings: {},
        buildHtml: () => '',
      })
    ).toBeNull();
  });
});
