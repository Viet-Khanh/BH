// "In thử" glue with the given settings: sample receipt, A4 template sample and
// one row of sample labels.
import { printHtml } from '../../utils/printUtils.js';
import { readPrintSettings } from './domain/printSettings.js';
import {
  buildSampleDocumentHtml,
  buildSampleLabelRows,
  buildSampleReceiptData,
  buildSampleReceiptHtml,
} from './domain/printSamples.js';
import { printLabelRows } from './labels/printLabels.js';
import { loadReceiptAssets } from './receipt/receiptAssets.js';
import { getReceiptPaper } from './receipt/receiptPaper.js';
import { getPrinterFor, printDocument } from './printTargets.js';

export const printSampleReceipt = async (settings) => {
  const assets = await loadReceiptAssets(buildSampleReceiptData(settings));
  return printHtml(buildSampleReceiptHtml(settings, assets), {
    deviceName: getPrinterFor(settings, 'receipt'),
    autoHeightWidthMm: getReceiptPaper(settings).widthMm,
  });
};

export const printSampleLabels = (settings) =>
  printLabelRows(buildSampleLabelRows(readPrintSettings(settings)), settings);

// "In thử A4": the invoice template sample on the A4 printer chosen on screen.
export const printSampleDocument = (settings) =>
  printDocument(buildSampleDocumentHtml(settings), {
    autoPageSize: true,
    deviceName: getPrinterFor(settings, 'document'),
  });
