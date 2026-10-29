// Printer routing: which configured printer each kind of print goes to
// ('' = system default; a missing printer falls back to the default with a warning).
import { useSettingsStore } from '../../store/settingsStore.js';
import { printHtml } from '../../utils/printUtils.js';
import { readPrintSettings } from './domain/printSettings.js';

const PRINTER_KEYS = {
  receipt: 'receiptPrinterName', // roll receipts
  document: 'documentPrinterName', // A4/A5 template, purchase invoice, debt receipts, lists
  label: 'labelPrinterName', // barcode labels
};

export const getPrinterFor = (settings, target) => {
  const key = PRINTER_KEYS[target];
  return key ? readPrintSettings(settings || {})[key] : '';
};

// printHtml on the stored document printer (a given `deviceName` wins, e.g. a test
// print of unsaved values); `forceDialog` lets the user pick in the dialog.
export const printDocument = (html, options = {}) => {
  if (options.forceDialog) return printHtml(html, options);
  const { settings } = useSettingsStore.getState();
  return printHtml(html, {
    ...options,
    deviceName: options.deviceName ?? getPrinterFor(settings, 'document'),
  });
};
