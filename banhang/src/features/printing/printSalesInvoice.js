// Sales invoice printing shared by the POS preview, recent sales and reports:
// the roll receipt on the receipt printer, else the caller's normal template on the
// document printer. `format: 'a4'` forces the template even when the paper is a roll.
import { printHtml } from '../../utils/printUtils.js';
import { getPrinterFor } from './printTargets.js';
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

const isRollJob = ({ settings, format }) =>
  Boolean(settings) && format !== 'a4' && getReceiptPaper(settings).roll;

// { html, options } for printHtml, or null when there is nothing to print.
// `assets` = ready-made { qrSvg, barcodeSvg } for the roll receipt (pure, sync).
// `format` = 'default' (the configured paper) | 'a4' (A5/A4 template).
export const buildSalesPrintJob = (params) => {
  const { settings, buildHtml, copies, assets } = params;
  if (!settings) return null;
  const printCopies = getCopies(settings, copies);
  if (isRollJob(params)) {
    return {
      html: buildReceiptHtml(toReceiptData(params), assets),
      options: {
        copies: printCopies,
        deviceName: getPrinterFor(settings, 'receipt'),
        autoHeightWidthMm: getReceiptPaper(settings).widthMm,
      },
    };
  }
  const html = buildHtml();
  if (!html) return null;
  const deviceName = getPrinterFor(settings, 'document');
  return {
    html,
    options: { copies: printCopies, autoPageSize: true, deviceName },
  };
};

export const printSalesInvoice = async (params) => {
  const roll = isRollJob(params);
  const assets = roll ? await loadReceiptAssets(toReceiptData(params)) : null;
  const job = buildSalesPrintJob({ ...params, assets });
  if (job) await printHtml(job.html, job.options);
};
