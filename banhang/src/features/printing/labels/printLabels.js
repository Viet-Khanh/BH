// Sends label rows to the label printer (one page per row of labels).
import { message } from 'antd';
import { printHtml } from '../../../utils/printUtils.js';
import { getLabelRowSize, readPrintSettings } from '../domain/printSettings.js';
import { loadBarcodeRenderer } from './barcodeSvg.js';
import { buildLabelPagesHtml } from './labelHtml.js';

export const printLabelRows = async (rows, settings = {}) => {
  const print = readPrintSettings(settings);
  let renderBarcode;
  try {
    renderBarcode = await loadBarcodeRenderer();
  } catch {
    message.error('Không thể tạo mã vạch để in tem.');
    return false;
  }
  const html = buildLabelPagesHtml({
    rows,
    print,
    shopName: settings?.shopName || '',
    renderBarcode,
  });
  return printHtml(html, {
    deviceName: print.labelPrinterName,
    pageSizeMm: getLabelRowSize(print),
  });
};
