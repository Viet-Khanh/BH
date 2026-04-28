import { formatMoney } from './moneyFormat.js';

const normalizeFlexibleNumberString = (value) => {
  if (value === null || value === undefined || value === '') return '';

  const sanitized = String(value)
    .trim()
    .replace(/\s+/g, '')
    .replace(/[^\d.,-]/g, '');
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
  if (value === null || value === undefined || value === '') return '';
  return String(value).replace(/\./g, '').replace(/,/g, '');
};

export const parseFlexibleNumberInput = (value) => {
  return normalizeFlexibleNumberString(value);
};

const parseFormatNumber = (value, info = {}) => {
  if (typeof value === 'number') return value;

  if (!info.userTyping) {
    const sanitized = String(value)
      .trim()
      .replace(/\s+/g, '')
      .replace(/[^\d.,-]/g, '');
    const hasDot = sanitized.includes('.');
    const hasComma = sanitized.includes(',');
    const thousandDotPattern = /^-?\d{1,3}(\.\d{3})+$/;
    const plainDecimalPattern = /^-?\d+\.\d+$/;

    if (hasDot && hasComma) {
      const parsed = Number(parseFlexibleNumberInput(value));
      if (!Number.isNaN(parsed)) return parsed;
    }

    if (
      hasDot &&
      !hasComma &&
      plainDecimalPattern.test(sanitized) &&
      !thousandDotPattern.test(sanitized)
    ) {
      const [integerPart, fractionPart] = sanitized.replace('-', '').split('.');
      if (integerPart.length > 3 || fractionPart.length > 6) {
        const parsed = Number(sanitized);
        if (!Number.isNaN(parsed)) return parsed;
      }
    }
  }

  const parsed = Number(parseNumberInput(value));
  if (!Number.isNaN(parsed)) return parsed;
  return Number(parseNumberInput(value));
};

export const formatNumberInput = (value, info = {}) => {
  if (value === null || value === undefined || value === '') return '';
  const numeric = parseFormatNumber(value, info);
  if (Number.isNaN(numeric)) return '';
  return formatMoney(numeric);
};
