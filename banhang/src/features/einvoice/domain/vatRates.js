// Same codes as banhang-backend/src/modules/einvoice/domain/vatRates.js.
export const VAT_RATE_OPTIONS = [
  { value: '0', label: '0%' },
  { value: '5', label: '5%' },
  { value: '8', label: '8%' },
  { value: '10', label: '10%' },
  { value: 'KCT', label: 'KCT – không chịu thuế' },
  { value: 'KKKNT', label: 'KKKNT – không kê khai, nộp thuế' },
];

// Display form used in export files: '8' → '8%', 'KCT' stays 'KCT'.
export const formatVatRate = (rate) =>
  /^\d+$/.test(String(rate ?? '')) ? `${rate}%` : rate || '';
