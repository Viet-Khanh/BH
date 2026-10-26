import dayjs from 'dayjs';
import { formatMoney } from '../../../utils/moneyFormat.js';
import { formatVatRate } from './vatRates.js';

// Vietnamese labels + display formatting for backend `diff` entries.
const LABELS = {
  name: 'Tên',
  companyName: 'Tên đơn vị',
  taxCode: 'MST',
  address: 'Địa chỉ',
  email: 'Email',
  unit: 'ĐVT',
  quantity: 'Số lượng',
  unitPrice: 'Đơn giá',
  amount: 'Thành tiền',
  vatRate: 'Thuế suất',
  note: 'Ghi chú',
  beforeTax: 'Tiền trước thuế',
  tax: 'Tiền thuế',
  total: 'Tổng tiền',
  date: 'Ngày',
};

const MONEY_FIELDS = new Set([
  'unitPrice',
  'amount',
  'beforeTax',
  'tax',
  'total',
]);

export const fieldLabel = (field) => LABELS[field] || field;

export const formatFieldValue = (field, value) => {
  if (value === undefined || value === null || value === '') return '—';
  if (MONEY_FIELDS.has(field)) return formatMoney(value);
  if (field === 'vatRate') return formatVatRate(value);
  if (field === 'date') return dayjs(value).format('DD/MM/YYYY HH:mm');
  return String(value);
};

const LINE_TYPES = {
  added: { label: 'Thêm dòng', color: 'green' },
  removed: { label: 'Bỏ dòng', color: 'red' },
  changed: { label: 'Sửa dòng', color: 'orange' },
};

export const lineChangeType = (type) => LINE_TYPES[type];

export const hasDiff = (diff) =>
  Boolean(
    diff &&
    (diff.deleted ||
      diff.date ||
      diff.buyer.length ||
      diff.lines.length ||
      diff.totals.length)
  );
