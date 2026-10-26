// Revenue per month/quarter for tax declaration: invoices, revenue, how much
// already has an e-invoice, and (deduction method) amounts per VAT rate.
// Built from the same documents as the export files. Deleted sales excluded.
const localParts = (iso, utcOffsetMinutes) => {
  const date = new Date(Date.parse(iso) + utcOffsetMinutes * 60000);
  return { year: date.getUTCFullYear(), month: date.getUTCMonth() + 1 };
};

const periodOf = (iso, groupBy, utcOffsetMinutes) => {
  const { year, month } = localParts(iso, utcOffsetMinutes);
  return groupBy === 'quarter'
    ? `${year}-Q${Math.ceil(month / 3)}`
    : `${year}-${String(month).padStart(2, '0')}`;
};

const emptyRow = (period) => ({
  period,
  invoiceCount: 0,
  total: 0,
  exportedCount: 0,
  exportedTotal: 0,
  pendingCount: 0,
  pendingTotal: 0,
  rates: {},
});

const addRates = (rates, lines) =>
  lines
    .filter((line) => line.vatRate)
    .forEach((line) => {
      const rate = (rates[line.vatRate] ||= { beforeTax: 0, tax: 0 });
      rate.beforeTax += Number(line.beforeTax || 0);
      rate.tax += Number(line.tax || 0);
    });

const addItem = (row, item) => {
  const total = Number(item.document.totals.total || 0);
  const issued = item.status !== 'pending';
  row.invoiceCount += 1;
  row.total += total;
  if (issued) {
    row.exportedCount += 1;
    row.exportedTotal += total;
  } else {
    row.pendingCount += 1;
    row.pendingTotal += total;
  }
  addRates(row.rates, item.document.lines);
};

const finish = ({ rates, ...row }) => ({
  ...row,
  byRate: Object.entries(rates)
    .map(([rate, sums]) => ({
      rate,
      ...sums,
      total: sums.beforeTax + sums.tax,
    }))
    .sort((a, b) => a.rate.localeCompare(b.rate, 'en', { numeric: true })),
});

export const buildRevenueReport = (
  items,
  { groupBy = 'month', utcOffsetMinutes = 420 } = {}
) => {
  const rows = new Map();
  const totals = emptyRow('Tổng');
  items
    .filter((item) => !item.deleted)
    .forEach((item) => {
      const period = periodOf(item.date, groupBy, utcOffsetMinutes);
      if (!rows.has(period)) rows.set(period, emptyRow(period));
      addItem(rows.get(period), item);
      addItem(totals, item);
    });
  return {
    rows: [...rows.values()]
      .sort((a, b) => a.period.localeCompare(b.period))
      .map(finish),
    totals: finish(totals),
  };
};
