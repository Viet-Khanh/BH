import { formatVatRate } from './vatRates.js';

// "2026-10" → "Tháng 10/2026", "2026-Q4" → "Quý 4/2026".
export const periodLabel = (period) => {
  const quarter = period.match(/^(\d{4})-Q(\d)$/);
  if (quarter) return `Quý ${quarter[2]}/${quarter[1]}`;
  const month = period.match(/^(\d{4})-(\d{2})$/);
  return month ? `Tháng ${Number(month[2])}/${month[1]}` : period;
};

const SUMMARY_HEADER = [
  'Kỳ',
  'Số hoá đơn',
  'Doanh thu',
  'Đã xuất HĐĐT (số HĐ)',
  'Đã xuất HĐĐT (tiền)',
  'Chưa xuất (số HĐ)',
  'Chưa xuất (tiền)',
];

const summaryRow = (row, label = periodLabel(row.period)) => [
  label,
  row.invoiceCount,
  row.total,
  row.exportedCount,
  row.exportedTotal,
  row.pendingCount,
  row.pendingTotal,
];

const rateRows = (rows) =>
  rows.flatMap((row) =>
    row.byRate.map((rate) => [
      periodLabel(row.period),
      formatVatRate(rate.rate),
      rate.beforeTax,
      rate.tax,
      rate.total,
    ])
  );

// Report → one sheet: summary per period (+ total), then amounts per VAT rate
// for the deduction method.
export const reportSheetRows = (report) => {
  const rows = [
    SUMMARY_HEADER,
    ...report.rows.map((row) => summaryRow(row)),
    summaryRow(report.totals, 'Tổng'),
  ];
  if (report.taxMethod !== 'deduction') return rows;
  return [
    ...rows,
    [],
    ['Kỳ', 'Thuế suất', 'Tiền trước thuế', 'Tiền thuế', 'Tổng cộng'],
    ...rateRows(report.rows),
    ...rateRows([{ ...report.totals, period: 'Tổng' }]),
  ];
};
