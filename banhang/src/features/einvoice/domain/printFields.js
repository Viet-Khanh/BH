import { escapeHtml } from '../../../utils/htmlEscape.js';

// Receipt template placeholders for the issued e-invoice. `{{einvoice.block}}`
// stays empty until the shop records the provider's invoice number.
export const buildEinvoicePrintFields = (invoice = {}, settings = {}) => {
  const einvoice = invoice.einvoice || {};
  const number = escapeHtml(einvoice.number || '');
  const series = escapeHtml(einvoice.series || '');
  const lookupCode = escapeHtml(einvoice.lookupCode || '');
  const lookupUrl = escapeHtml(settings.einvoiceLookupUrl || '');
  const parts = number
    ? [
        `HĐĐT số ${number}${series ? ` (ký hiệu ${series})` : ''}`,
        lookupUrl && `Tra cứu tại ${lookupUrl}`,
        lookupCode && `Mã tra cứu: ${lookupCode}`,
      ].filter(Boolean)
    : [];
  return {
    '{{einvoice.number}}': number,
    '{{einvoice.series}}': series,
    '{{einvoice.lookupCode}}': lookupCode,
    '{{einvoice.lookupUrl}}': lookupUrl,
    '{{einvoice.block}}': parts.length
      ? `<div class="einvoice-info">${parts.join(' · ')}</div>`
      : '',
  };
};
