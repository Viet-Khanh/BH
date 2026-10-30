import dayjs from 'dayjs';

const stockNumberFormatter = new Intl.NumberFormat('vi-VN', {
  maximumFractionDigits: 2,
});

const EMPTY_VALUE = '–';
const NO_UNIT_LABEL = 'không ĐVT';
const TOTAL_FIELDS = [
  'openingStock',
  'inQty',
  'inArea',
  'outQty',
  'outArea',
  'closingStock',
];

export const formatStockNumber = (value) =>
  stockNumberFormatter.format(Number(value || 0));

export const formatStockArea = (value) =>
  Number(value || 0) ? formatStockNumber(value) : EMPTY_VALUE;

export const formatStockSize = (length, width) =>
  length && width
    ? `${formatStockNumber(length)} × ${formatStockNumber(width)}`
    : EMPTY_VALUE;

export const buildStockRangeLabels = (range) => {
  const [start, end] = range || [];
  return {
    opening: start
      ? `đến 00:00 ${dayjs(start).format('DD/MM/YYYY')}`
      : 'từ đầu',
    period:
      start || end
        ? `${start ? dayjs(start).format('DD/MM') : '…'} – ${end ? dayjs(end).format('DD/MM') : '…'}`
        : 'toàn bộ',
    closing: end ? `đến 23:59 ${dayjs(end).format('DD/MM/YYYY')}` : 'hiện tại',
  };
};

export const buildStockMovementExportRow = (row) => ({
  'Tên hàng': row.name,
  ĐVT: row.unit,
  'Tồn đầu': row.openingStock,
  'Nhập SL': row.inQty,
  'Nhập m²': Number(Number(row.inArea || 0).toFixed(2)),
  'Xuất SL': row.outQty,
  'Xuất m²': Number(Number(row.outArea || 0).toFixed(2)),
  'Tồn cuối': row.closingStock,
});

// Quantities of different units cannot be added together.
export const buildStockTotalsByUnit = (rows = []) => {
  const totals = new Map();
  rows.forEach((row) => {
    const unit = row.unit || NO_UNIT_LABEL;
    const current =
      totals.get(unit) ||
      Object.fromEntries(TOTAL_FIELDS.map((field) => [field, 0]));
    TOTAL_FIELDS.forEach((field) => {
      current[field] += Number(row[field] || 0);
    });
    totals.set(unit, current);
  });
  return [...totals.entries()].map(([unit, values]) => ({ unit, ...values }));
};
