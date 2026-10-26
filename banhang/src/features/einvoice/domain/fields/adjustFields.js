import { DATE_FORMATS } from './formats.js';

const KIND_TEXT = { replace: 'Thay thế', reduce: 'Điều chỉnh giảm' };

// Adjustment / replacement fields (documents carry `adjustment`, see backend
// domain/adjustment.js); empty on normal invoices.
export const ADJUST_FIELDS = [
  {
    key: 'adjustKind',
    label: 'Loại (Thay thế / Điều chỉnh giảm)',
    value: ({ doc }) => KIND_TEXT[doc.adjustment?.kind] || '',
  },
  {
    key: 'originalNumber',
    label: 'Số hoá đơn gốc',
    value: ({ doc }) => doc.adjustment?.originalNumber || '',
  },
  {
    key: 'originalSeries',
    label: 'Ký hiệu hoá đơn gốc',
    value: ({ doc }) => doc.adjustment?.originalSeries || '',
  },
  {
    key: 'originalDate',
    label: 'Ngày hoá đơn gốc',
    formats: DATE_FORMATS,
    value: ({ doc }, format) => format(doc.adjustment?.originalDate),
  },
];
