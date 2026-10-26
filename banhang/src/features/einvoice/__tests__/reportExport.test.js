import { describe, expect, it } from 'vitest';
import { periodLabel, reportSheetRows } from '../domain/reportExport.js';

const row = (period) => ({
  period,
  invoiceCount: 2,
  total: 300,
  exportedCount: 1,
  exportedTotal: 100,
  pendingCount: 1,
  pendingTotal: 200,
  byRate: [{ rate: '8', beforeTax: 278, tax: 22, total: 300 }],
});

describe('report export', () => {
  it('labels periods', () => {
    expect(periodLabel('2026-10')).toBe('Tháng 10/2026');
    expect(periodLabel('2026-Q4')).toBe('Quý 4/2026');
  });

  it('writes the summary, and VAT rates for the deduction method', () => {
    const report = { rows: [row('2026-10')], totals: row('total') };
    const direct = reportSheetRows({ ...report, taxMethod: 'direct' });
    expect(direct).toHaveLength(3);
    expect(direct[2][0]).toBe('Tổng');
    const deduction = reportSheetRows({ ...report, taxMethod: 'deduction' });
    expect(deduction.slice(4)).toEqual([
      ['Kỳ', 'Thuế suất', 'Tiền trước thuế', 'Tiền thuế', 'Tổng cộng'],
      ['Tháng 10/2026', '8%', 278, 22, 300],
      ['Tổng', '8%', 278, 22, 300],
    ]);
  });
});
