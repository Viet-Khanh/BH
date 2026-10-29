import { text } from './html.js';

// Code128 of the invoice code (SVG made beforehand by receiptAssets).
export const renderBarcode = ({ barcodeSvg, invoice }) =>
  barcodeSvg
    ? `<div class="center"><div class="barcode">${barcodeSvg}</div><div class="small">${text(invoice.code || '')}</div></div>`
    : '';
