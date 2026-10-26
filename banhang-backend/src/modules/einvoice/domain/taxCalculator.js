import { vatRateToNumber } from './vatRates.js';

// Splits one line amount (VND) into before-tax and tax, rounding per line.
// With VAT-inclusive prices the line total stays exactly what the customer paid.
export const splitTax = ({ amount, rate, pricesIncludeVat }) => {
  const total = Math.round(Number(amount || 0));
  const ratio = vatRateToNumber(rate);
  if (pricesIncludeVat) {
    const beforeTax = Math.round(total / (1 + ratio));
    return { beforeTax, tax: total - beforeTax, total };
  }
  const tax = Math.round(total * ratio);
  return { beforeTax: total, tax, total: total + tax };
};
