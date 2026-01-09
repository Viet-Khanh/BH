import { formatMoney } from './moneyFormat.js';

export const parseNumberInput = (value) => {
  if (value === null || value === undefined || value === '') return '';
  return String(value).replace(/\./g, '').replace(/,/g, '');
};

export const formatNumberInput = (value) => {
  if (value === null || value === undefined || value === '') return '';
  const numeric = typeof value === 'number' ? value : Number(parseNumberInput(value));
  if (Number.isNaN(numeric)) return '';
  return formatMoney(numeric);
};
