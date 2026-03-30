import { formatMoney } from './moneyFormat.js';

const normalizeNumberString = (value) => {
  if (value === null || value === undefined || value === '') return '';

  const sanitized = String(value).trim().replace(/\s+/g, '').replace(/[^\d.,-]/g, '');
  if (!sanitized) return '';

  const hasDot = sanitized.includes('.');
  const hasComma = sanitized.includes(',');

  if (hasDot && hasComma) {
    return sanitized.lastIndexOf(',') > sanitized.lastIndexOf('.')
      ? sanitized.replace(/\./g, '').replace(',', '.')
      : sanitized.replace(/,/g, '');
  }

  if (hasDot) {
    return /^\d{1,3}(\.\d{3})+$/.test(sanitized)
      ? sanitized.replace(/\./g, '')
      : sanitized;
  }

  if (hasComma) {
    return /^\d{1,3}(,\d{3})+$/.test(sanitized)
      ? sanitized.replace(/,/g, '')
      : sanitized.replace(',', '.');
  }

  return sanitized;
};

export const parseNumberInput = (value) => {
  return normalizeNumberString(value);
};

export const formatNumberInput = (value) => {
  if (value === null || value === undefined || value === '') return '';
  const numeric = typeof value === 'number' ? value : Number(normalizeNumberString(value));
  if (Number.isNaN(numeric)) return '';
  return formatMoney(numeric);
};
