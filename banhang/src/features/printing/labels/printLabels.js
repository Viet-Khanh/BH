// Sends label rows to the label printer (one page per row of labels).
import { printHtml } from '../../../utils/printUtils.js';
import { getLabelRowSize, readPrintSettings } from '../domain/printSettings.js';
import { renderBarcodeSvg } from './barcodeSvg.js';
import { buildLabelPagesHtml } from './labelHtml.js';

export const printLabelRows = (rows, settings = {}) => {
  const print = readPrintSettings(settings);
  const html = buildLabelPagesHtml({
    rows,
    print,
    shopName: settings?.shopName || '',
    renderBarcode: renderBarcodeSvg,
  });
  return printHtml(html, {
    deviceName: print.labelPrinterName,
    pageSizeMm: getLabelRowSize(print),
  });
};
