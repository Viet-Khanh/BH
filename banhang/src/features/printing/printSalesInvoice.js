// Sales invoice printing shared by the POS preview, recent sales and reports:
// the 58 mm receipt on the receipt printer, else the caller's normal template.
import { printHtml } from '../../utils/printUtils.js';
import { buildReceipt58Html } from './receipt58.js';

const getCopies = (settings, copies) =>
  Math.max(1, Math.round(Number(copies ?? settings?.printCopies ?? 1)));

// { html, options } for printHtml, or null when there is nothing to print.
export const buildSalesPrintJob = ({
  settings,
  invoice,
  items,
  products,
  customer,
  payments,
  buildHtml,
  copies,
}) => {
  if (!settings) return null;
  const printCopies = getCopies(settings, copies);
  if (settings.receiptPaper === '58mm') {
    const html = buildReceipt58Html({
      invoice,
      items: items ?? invoice?.items ?? [],
      products,
      customer,
      payments,
      settings,
    });
    return {
      html,
      options: {
        copies: printCopies,
        deviceName: settings.receiptPrinterName,
        autoHeightWidthMm: 58,
      },
    };
  }
  const html = buildHtml();
  if (!html) return null;
  return { html, options: { copies: printCopies, autoPageSize: true } };
};

export const printSalesInvoice = async (params) => {
  const job = buildSalesPrintJob(params);
  if (job) await printHtml(job.html, job.options);
};
