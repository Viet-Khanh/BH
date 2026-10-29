// "In thử" glue: sample receipt and one row of sample labels with the given settings.
import { printHtml } from '../../utils/printUtils.js';
import { readPrintSettings } from './domain/printSettings.js';
import {
  buildSampleLabelRows,
  buildSampleReceiptData,
  buildSampleReceiptHtml,
} from './domain/printSamples.js';
import { printLabelRows } from './labels/printLabels.js';
import { loadReceiptAssets } from './receipt/receiptAssets.js';
import { getReceiptPaper } from './receipt/receiptPaper.js';

export const printSampleReceipt = async (settings) => {
  const assets = await loadReceiptAssets(buildSampleReceiptData(settings));
  return printHtml(buildSampleReceiptHtml(settings, assets), {
    deviceName: readPrintSettings(settings).receiptPrinterName,
    autoHeightWidthMm: getReceiptPaper(settings).widthMm,
  });
};

export const printSampleLabels = (settings) =>
  printLabelRows(buildSampleLabelRows(readPrintSettings(settings)), settings);
