// Printer and label settings (merged into store/settingsDefaults.js).
import { normalizeReceiptLayout } from '../receipt/receiptLayout.js';

export const PRINT_DEFAULT_SETTINGS = {
  printCopies: 1,
  receiptPaper: 'auto',
  receiptPrinterName: '',
  receiptWidthMm: 58,
  receiptMarginMm: 5,
  receiptLayout: normalizeReceiptLayout(),
  receiptLogo: '',
  documentPrinterName: '',
  labelPrinterName: '',
  labelWidthMm: 35,
  labelHeightMm: 22,
  labelColumns: 2,
  labelGapMm: 2,
  labelOffsetXMm: 0,
  labelOffsetYMm: 0,
  labelShowShopName: true,
  labelShowPrice: true,
  autoPrintLabelsOnPurchase: true,
};

export const RECEIPT_PAPERS = ['auto', '58mm', '80mm', 'custom'];

export const LABEL_PRESETS = [
  {
    value: '35x22x2',
    label: '35 × 22 mm, 2 tem/hàng',
    widthMm: 35,
    heightMm: 22,
    columns: 2,
  },
  {
    value: '40x30x1',
    label: '40 × 30 mm, 1 tem/hàng',
    widthMm: 40,
    heightMm: 30,
    columns: 1,
  },
  {
    value: '50x30x1',
    label: '50 × 30 mm, 1 tem/hàng',
    widthMm: 50,
    heightMm: 30,
    columns: 1,
  },
];

const NUMBER_RANGES = {
  printCopies: [1, 10],
  receiptWidthMm: [40, 112],
  receiptMarginMm: [0, 10],
  labelWidthMm: [10, 120],
  labelHeightMm: [10, 120],
  labelColumns: [1, 4],
  labelGapMm: [0, 20],
  labelOffsetXMm: [-10, 10],
  labelOffsetYMm: [-10, 10],
};

const readNumber = (value, fallback, [min, max]) => {
  if (value === null || value === undefined || value === '') return fallback;
  const number = Number(value);
  if (!Number.isFinite(number)) return fallback;
  return Math.min(max, Math.max(min, number));
};

const readText = (value) => (typeof value === 'string' ? value.trim() : '');

// Only an embedded image (PNG data URL from the designer) may become the logo.
const readLogo = (value) =>
  typeof value === 'string' && /^data:image\/[a-z+.-]+;base64,/i.test(value)
    ? value
    : '';

const readBoolean = (value, fallback) =>
  typeof value === 'boolean' ? value : fallback;

// Settings with print defaults filled and numbers clamped to sane ranges.
export const readPrintSettings = (settings = {}) => {
  const source = settings || {};
  const defaults = PRINT_DEFAULT_SETTINGS;
  const numbers = Object.fromEntries(
    Object.entries(NUMBER_RANGES).map(([key, range]) => [
      key,
      readNumber(source[key], defaults[key], range),
    ])
  );
  numbers.labelColumns = Math.round(numbers.labelColumns);
  numbers.printCopies = Math.floor(numbers.printCopies);
  return {
    receiptPaper: RECEIPT_PAPERS.includes(source.receiptPaper)
      ? source.receiptPaper
      : defaults.receiptPaper,
    receiptPrinterName: readText(source.receiptPrinterName),
    receiptLayout: normalizeReceiptLayout(source.receiptLayout),
    receiptLogo: readLogo(source.receiptLogo),
    documentPrinterName: readText(source.documentPrinterName),
    labelPrinterName: readText(source.labelPrinterName),
    ...numbers,
    labelShowShopName: readBoolean(
      source.labelShowShopName,
      defaults.labelShowShopName
    ),
    labelShowPrice: readBoolean(source.labelShowPrice, defaults.labelShowPrice),
    autoPrintLabelsOnPurchase: readBoolean(
      source.autoPrintLabelsOnPurchase,
      defaults.autoPrintLabelsOnPurchase
    ),
  };
};

// Page size of one label row in mm.
export const getLabelRowSize = (print) => ({
  widthMm:
    print.labelColumns * print.labelWidthMm +
    (print.labelColumns - 1) * print.labelGapMm,
  heightMm: print.labelHeightMm,
});

// Open the label list after a new purchase: edition flag `labels` + the setting.
export const shouldAutoPrintLabels = (settings, labelsEnabled) =>
  Boolean(labelsEnabled) &&
  readPrintSettings(settings).autoPrintLabelsOnPurchase;
