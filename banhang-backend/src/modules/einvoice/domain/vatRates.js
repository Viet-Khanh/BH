// Rates accepted on Vietnamese e-invoices.
// KCT = not subject to VAT, KKKNT = not declared / not paid.
export const VAT_RATES = ['0', '5', '8', '10', 'KCT', 'KKKNT'];

// null = not set, undefined = invalid.
export const normalizeVatRate = (value) => {
  if (value === null || value === undefined || value === '') return null;
  const rate = String(value).trim().toUpperCase().replace('%', '');
  return VAT_RATES.includes(rate) ? rate : undefined;
};

export const vatRateToNumber = (rate) =>
  ['5', '8', '10'].includes(rate) ? Number(rate) / 100 : 0;
