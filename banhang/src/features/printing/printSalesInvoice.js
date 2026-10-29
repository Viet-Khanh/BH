// Sales invoice printing shared by the POS preview, recent sales and reports:
// the roll receipt on the receipt printer, else the caller's normal template.
import { printHtml } from '../../utils/printUtils.js';
import { loadReceiptAssets } from './receipt/receiptAssets.js';
import { buildReceiptHtml } from './receipt/receiptHtml.js';
import { getReceiptPaper } from './receipt/receiptPaper.js';

const getCopies = (settings, copies) =>
  Math.max(1, Math.round(Number(copies ?? settings?.printCopies ?? 1)));

const toReceiptData = ({
  settings,
  invoice,
  items,
  products,
  customer,
  payments,
}) => ({
  invoice,
  items: items ?? invoice?.items ?? [],
  products,
  customer,
  payments,
  settings,
});

// { html, options } for printHtml, or null when there is nothing to print.
// `assets` = ready-made { qrSvg, barcodeSvg } for the roll receipt (pure, sync).
export const buildSalesPrintJob = (params) => {
  const { settings, buildHtml, copies, assets } = params;
  if (!settings) return null;
  const printCopies = getCopies(settings, copies);
  const paper = getReceiptPaper(settings);
  if (paper.roll) {
    return {
      html: buildReceiptHtml(toReceiptData(params), assets),
      options: {
        copies: printCopies,
        deviceName: settings.receiptPrinterName,
        autoHeightWidthMm: paper.widthMm,
      },
    };
  }
  const html = buildHtml();
  if (!html) return null;
  return { html, options: { copies: printCopies, autoPageSize: true } };
};

export const printSalesInvoice = async (params) => {
  const roll = params.settings && getReceiptPaper(params.settings).roll;
  const assets = roll ? await loadReceiptAssets(toReceiptData(params)) : null;
  const job = buildSalesPrintJob({ ...params, assets });
  if (job) await printHtml(job.html, job.options);
};
