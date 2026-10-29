// Roll paper geometry from settings. `auto` = A5/A4 template (not a roll); its
// numbers are the 58 mm preset so a receipt can still be rendered (samples, preview).
import { readPrintSettings } from '../domain/printSettings.js';

const PRESETS = {
  '58mm': { widthMm: 58, marginMm: 5 },
  '80mm': { widthMm: 80, marginMm: 4 },
};

export const getReceiptPaper = (settings) => {
  const print = readPrintSettings(settings || {});
  const preset =
    print.receiptPaper === 'custom'
      ? { widthMm: print.receiptWidthMm, marginMm: print.receiptMarginMm }
      : PRESETS[print.receiptPaper] || PRESETS['58mm'];
  return {
    roll: print.receiptPaper !== 'auto',
    ...preset,
    printableMm: preset.widthMm - 2 * preset.marginMm,
  };
};

export const isRollPaper = (settings) => getReceiptPaper(settings).roll;
