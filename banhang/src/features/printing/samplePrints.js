// "In thử" glue: sample receipt and one row of sample labels with the given settings.
import { printHtml } from '../../utils/printUtils.js';
import { readPrintSettings } from './domain/printSettings.js';
import {
  buildSampleLabelRows,
  buildSampleReceiptHtml,
} from './domain/printSamples.js';
import { printLabelRows } from './labels/printLabels.js';

export const printSampleReceipt = (settings) =>
  printHtml(buildSampleReceiptHtml(settings), {
    deviceName: readPrintSettings(settings).receiptPrinterName,
    autoHeightWidthMm: 58,
  });

export const printSampleLabels = (settings) =>
  printLabelRows(buildSampleLabelRows(readPrintSettings(settings)), settings);
