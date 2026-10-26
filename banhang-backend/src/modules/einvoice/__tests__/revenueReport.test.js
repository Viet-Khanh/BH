import { describe, expect, it } from 'vitest';
import { buildRevenueReport } from '../domain/revenueReport.js';

const item = (date, status, lines, deleted = false) => ({
  date,
  status,
  deleted,
  document: {
    totals: {
      total: lines.reduce((sum, line) => sum + line.beforeTax + line.tax, 0),
    },
    lines,
  },
});
const line = (vatRate, beforeTax, tax) => ({ vatRate, beforeTax, tax });

describe('buildRevenueReport', () => {
  const items = [
    // 31/10 20:00 UTC is 1/11 in Vietnam.
    item('2026-10-31T20:00:00.000Z', 'exported', [line('8', 100000, 8000)]),
    item('2026-10-05T03:00:00.000Z', 'pending', [
      line('10', 50000, 5000),
      line('8', 50000, 4000),
    ]),
    item('2026-10-06T03:00:00.000Z', 'changed', [line('8', 1000, 80)]),
    item('2026-10-07T03:00:00.000Z', 'exported', [line('8', 9, 1)], true),
  ];

  it('groups by local month with exported/pending split and rates', () => {
    const { rows, totals } = buildRevenueReport(items);
    expect(rows.map((row) => row.period)).toEqual(['2026-10', '2026-11']);
    expect(rows[0]).toMatchObject({
      invoiceCount: 2,
      total: 110080,
      exportedCount: 1,
      exportedTotal: 1080,
      pendingCount: 1,
      pendingTotal: 109000,
    });
    expect(rows[0].byRate).toEqual([
      { rate: '8', beforeTax: 51000, tax: 4080, total: 55080 },
      { rate: '10', beforeTax: 50000, tax: 5000, total: 55000 },
    ]);
    expect(totals.total).toBe(218080);
  });

  it('groups by quarter', () => {
    const { rows } = buildRevenueReport(items, { groupBy: 'quarter' });
    expect(rows.map((row) => [row.period, row.invoiceCount])).toEqual([
      ['2026-Q4', 3],
    ]);
  });
});
