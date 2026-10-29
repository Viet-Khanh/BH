// Everything the block renderers need, computed once per receipt.
import { readPrintSettings } from '../domain/printSettings.js';
import { getReceiptAmounts } from './receiptAmounts.js';
import { getReceiptPaper } from './receiptPaper.js';

// `assets` are ready-made SVG strings ('' = block shows nothing).
export const buildReceiptContext = (
  {
    invoice = {},
    items,
    products = [],
    customer = null,
    payments = [],
    settings = {},
  } = {},
  { qrSvg = '', barcodeSvg = '' } = {}
) => {
  const print = readPrintSettings(settings);
  const lines = items ?? invoice?.items ?? [];
  return {
    settings: settings || {},
    invoice: invoice || {},
    items: lines,
    products: products || [],
    customer,
    payments: payments || [],
    paper: getReceiptPaper(settings),
    layout: print.receiptLayout,
    amounts: getReceiptAmounts(invoice || {}, payments, lines),
    qrSvg: qrSvg || '',
    barcodeSvg: barcodeSvg || '',
    logo: print.receiptLogo,
  };
};
