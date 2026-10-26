import { ADJUST_FIELDS } from './adjustFields.js';
import { INVOICE_FIELDS } from './invoiceFields.js';
import { LINE_FIELDS } from './lineFields.js';

// Field catalog used by data profiles: column.field → value.
// `constant` writes column.constant; `empty` writes ''.
const SPECIAL_FIELDS = [
  { key: 'constant', label: 'Giá trị cố định', value: () => '' },
  { key: 'empty', label: 'Để trống', value: () => '' },
];

export const FIELD_GROUPS = [
  { label: 'Hoá đơn & người mua', fields: INVOICE_FIELDS },
  { label: 'Dòng hàng', fields: LINE_FIELDS },
  { label: 'Điều chỉnh / thay thế', fields: ADJUST_FIELDS },
  { label: 'Khác', fields: SPECIAL_FIELDS },
];

const FIELDS = new Map(
  FIELD_GROUPS.flatMap((group) => group.fields).map((field) => [
    field.key,
    field,
  ])
);

export const getField = (key) => FIELDS.get(key) || null;

export const formatOptions = (key) =>
  Object.entries(getField(key)?.formats || {}).map(([value, format]) => ({
    value,
    label: format.label,
  }));

// The column's format, else the field's first one.
const resolveFormat = (field, formatKey) => {
  if (!field.formats) return null;
  const entry =
    field.formats[formatKey] || Object.values(field.formats)[0] || null;
  return entry?.format || null;
};

export const columnValue = (column, ctx) => {
  if (column.field === 'constant') return column.constant ?? '';
  const field = getField(column.field);
  if (!field) return '';
  if (column.firstLineOnly && ctx.lineIndex > 0) return '';
  return field.value(ctx, resolveFormat(field, column.format)) ?? '';
};
