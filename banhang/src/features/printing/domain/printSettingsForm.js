// Mapping between Settings and the printer forms (System → In ấn) (label preset is form-only).
import { LABEL_PRESETS, readPrintSettings } from './printSettings.js';

export const CUSTOM_PRESET = 'custom';

export const LABEL_PRESET_OPTIONS = [
  ...LABEL_PRESETS.map(({ value, label }) => ({ value, label })),
  { value: CUSTOM_PRESET, label: 'Tùy chỉnh' },
];

export const getPresetValue = (print) =>
  LABEL_PRESETS.find(
    (preset) =>
      preset.widthMm === print.labelWidthMm &&
      preset.heightMm === print.labelHeightMm &&
      preset.columns === print.labelColumns
  )?.value || CUSTOM_PRESET;

export const toPrintFormValues = (settings = {}) => {
  const print = readPrintSettings(settings);
  return { ...print, labelPreset: getPresetValue(print) };
};

// Form values → Settings fields (preset sizes win; numbers clamped, names trimmed).
export const fromPrintFormValues = (values = {}) => {
  const { labelPreset, ...rest } = values;
  const preset = LABEL_PRESETS.find((item) => item.value === labelPreset);
  return readPrintSettings(
    preset
      ? {
          ...rest,
          labelWidthMm: preset.widthMm,
          labelHeightMm: preset.heightMm,
          labelColumns: preset.columns,
        }
      : rest
  );
};

// Saved by the receipt designer, never by the printer forms (they may hold stale copies).
export const DESIGNER_KEYS = ['receiptLayout', 'receiptLogo'];

// Settings each printer form owns and saves (so one form never writes back
// another form's stale values).
export const RECEIPT_FORM_NAMES = [
  'printCopies',
  'receiptPaper',
  'receiptPrinterName',
  'receiptWidthMm',
  'receiptMarginMm',
];
export const DOCUMENT_FORM_NAMES = ['documentPrinterName'];
export const LABEL_FORM_NAMES = [
  'labelPrinterName',
  'labelWidthMm',
  'labelHeightMm',
  'labelColumns',
  'labelGapMm',
  'labelOffsetXMm',
  'labelOffsetYMm',
  'labelShowShopName',
  'labelShowPrice',
  'autoPrintLabelsOnPurchase',
];

export const omitDesignerSettings = (settings = {}) =>
  Object.fromEntries(
    Object.entries(settings).filter(([key]) => !DESIGNER_KEYS.includes(key))
  );

// Only the named settings (all without names): a form that saves just its own fields.
export const pickSettings = (settings = {}, names) =>
  names
    ? Object.fromEntries(
        Object.entries(settings).filter(([key]) => names.includes(key))
      )
    : settings;

const SIZE_FIELDS = ['labelWidthMm', 'labelHeightMm', 'labelColumns'];

// Form patch keeping preset and sizes in step (Form onValuesChange), or null.
export const syncPresetFields = (changed = {}, all = {}) => {
  if ('labelPreset' in changed) {
    const preset = LABEL_PRESETS.find(
      (item) => item.value === changed.labelPreset
    );
    if (!preset) return null;
    return {
      labelWidthMm: preset.widthMm,
      labelHeightMm: preset.heightMm,
      labelColumns: preset.columns,
    };
  }
  if (!SIZE_FIELDS.some((field) => field in changed)) return null;
  return { labelPreset: getPresetValue(all) };
};

// Printer select options; '' = system default. `printers` is null on the web.
export const toPrinterOptions = (printers, current = '') => {
  const list = Array.isArray(printers) ? printers : [];
  const options = [
    { value: '', label: 'Máy in mặc định' },
    ...list.map((printer) => ({
      value: printer.name,
      label: `${printer.displayName || printer.name}${printer.isDefault ? ' (mặc định)' : ''}`,
    })),
  ];
  if (current && !list.some((printer) => printer.name === current)) {
    const missing = Array.isArray(printers) ? ' (không tìm thấy)' : '';
    options.push({ value: current, label: `${current}${missing}` });
  }
  return options;
};

export const RECEIPT_PAPER_OPTIONS = [
  { value: 'auto', label: 'Tự động A5/A4' },
  { value: '58mm', label: 'Cuộn 58mm' },
  { value: '80mm', label: 'Cuộn 80mm' },
  { value: 'custom', label: 'Tùy chỉnh' },
];
