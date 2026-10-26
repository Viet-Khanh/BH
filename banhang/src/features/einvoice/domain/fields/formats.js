import dayjs from 'dayjs';

// Value formats a column can pick; providers disagree on codes (see README).
const VAT_SPECIAL = {
  plain: { KCT: 'KCT', KKKNT: 'KKKNT' },
  percent: { KCT: 'KCT', KKKNT: 'KKKNT' },
  decimal: { KCT: 'KCT', KKKNT: 'KKKNT' },
  viettel: { KCT: -2, KKKNT: -1 },
  easyinvoice: { KCT: -1, KKKNT: -2 },
};

const formatVat = (style) => (rate) => {
  if (rate === undefined || rate === null || rate === '') return '';
  const special = VAT_SPECIAL[style][rate];
  if (special !== undefined) return special;
  const number = Number(rate);
  if (style === 'percent') return `${number}%`;
  if (style === 'decimal') return number / 100;
  return number;
};

export const VAT_FORMATS = {
  plain: { label: '8 · KCT · KKKNT', format: formatVat('plain') },
  percent: { label: '8% · KCT · KKKNT', format: formatVat('percent') },
  decimal: { label: '0.08 (tỉ lệ)', format: formatVat('decimal') },
  viettel: {
    label: '8 · KCT=-2 · KKKNT=-1 (Viettel)',
    format: formatVat('viettel'),
  },
  easyinvoice: {
    label: '8 · KCT=-1 · KKKNT=-2 (EasyInvoice, M-Invoice)',
    format: formatVat('easyinvoice'),
  },
};

export const DATE_FORMATS = {
  dmy: {
    label: 'dd/mm/yyyy',
    format: (date) => (date ? dayjs(date).format('DD/MM/YYYY') : ''),
  },
  ymd: {
    label: 'yyyy-mm-dd',
    format: (date) => (date ? dayjs(date).format('YYYY-MM-DD') : ''),
  },
};

const PAYMENT_TEXT = {
  TM: 'Tiền mặt',
  CK: 'Chuyển khoản',
  'TM/CK': 'Tiền mặt/Chuyển khoản',
};

export const PAYMENT_FORMATS = {
  code: { label: 'TM · CK · TM/CK', format: (code) => code || '' },
  text: {
    label: 'Tiền mặt · Chuyển khoản',
    format: (code) => PAYMENT_TEXT[code] || code || '',
  },
};

export const money = (value) =>
  value === undefined || value === null || value === ''
    ? ''
    : Math.round(Number(value));
