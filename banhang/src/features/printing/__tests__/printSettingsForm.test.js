import { describe, expect, it } from 'vitest';
import { PRINT_DEFAULT_SETTINGS } from '../domain/printSettings.js';
import {
  CUSTOM_PRESET,
  fromPrintFormValues,
  getPresetValue,
  DESIGNER_KEYS,
  DOCUMENT_FORM_NAMES,
  LABEL_FORM_NAMES,
  PURCHASE_FORM_NAMES,
  RECEIPT_FORM_NAMES,
  LABEL_PRESET_OPTIONS,
  omitDesignerSettings,
  pickSettings,
  RECEIPT_PAPER_OPTIONS,
  syncPresetFields,
  toPrintFormValues,
  toPrinterOptions,
} from '../domain/printSettingsForm.js';

describe('getPresetValue', () => {
  it('finds the preset of a label size, else custom', () => {
    expect(
      getPresetValue({ labelWidthMm: 40, labelHeightMm: 30, labelColumns: 1 })
    ).toBe('40x30x1');
    expect(
      getPresetValue({ labelWidthMm: 40, labelHeightMm: 30, labelColumns: 2 })
    ).toBe(CUSTOM_PRESET);
  });
});

describe('toPrintFormValues', () => {
  it('fills defaults and derives the preset', () => {
    expect(toPrintFormValues({ shopName: 'X' })).toEqual({
      ...PRINT_DEFAULT_SETTINGS,
      labelPreset: '35x22x2',
    });
  });

  it('keeps stored values and marks unknown sizes as custom', () => {
    const values = toPrintFormValues({
      receiptPaper: '58mm',
      labelPrinterName: 'Xprinter 365B',
      labelWidthMm: 30,
    });
    expect(values).toMatchObject({
      receiptPaper: '58mm',
      labelPrinterName: 'Xprinter 365B',
      labelWidthMm: 30,
      labelPreset: CUSTOM_PRESET,
    });
  });
});

describe('fromPrintFormValues', () => {
  it('applies the chosen preset sizes and drops the preset field', () => {
    const settings = fromPrintFormValues({
      ...toPrintFormValues({}),
      labelPreset: '50x30x1',
      labelWidthMm: 35,
    });
    expect(settings).toMatchObject({
      labelWidthMm: 50,
      labelHeightMm: 30,
      labelColumns: 1,
    });
    expect(settings).not.toHaveProperty('labelPreset');
    expect(Object.keys(settings).sort()).toEqual(
      Object.keys(PRINT_DEFAULT_SETTINGS).sort()
    );
  });

  it('clamps custom numbers and trims printer names', () => {
    const settings = fromPrintFormValues({
      labelPreset: CUSTOM_PRESET,
      labelWidthMm: 500,
      labelColumns: 9,
      labelOffsetXMm: null,
      receiptPrinterName: '  XP-58 ',
      autoPrintLabelsOnPurchase: false,
    });
    expect(settings).toMatchObject({
      labelWidthMm: 120,
      labelColumns: 4,
      labelOffsetXMm: 0,
      receiptPrinterName: 'XP-58',
      autoPrintLabelsOnPurchase: false,
    });
  });
});

it('lists the receipt papers', () => {
  expect(RECEIPT_PAPER_OPTIONS).toEqual([
    { value: 'auto', label: 'Tự động A5/A4' },
    { value: '58mm', label: 'Cuộn 58mm' },
    { value: '80mm', label: 'Cuộn 80mm' },
    { value: 'custom', label: 'Tùy chỉnh' },
  ]);
});

it('lists the presets plus "Tùy chỉnh"', () => {
  expect(LABEL_PRESET_OPTIONS.map((option) => option.value)).toEqual([
    '35x22x2',
    '40x30x1',
    '50x30x1',
    CUSTOM_PRESET,
  ]);
  expect(LABEL_PRESET_OPTIONS.at(-1).label).toBe('Tùy chỉnh');
});

describe('syncPresetFields', () => {
  it('fills the sizes when a preset is picked', () => {
    expect(syncPresetFields({ labelPreset: '40x30x1' }, {})).toEqual({
      labelWidthMm: 40,
      labelHeightMm: 30,
      labelColumns: 1,
    });
    expect(syncPresetFields({ labelPreset: CUSTOM_PRESET }, {})).toBeNull();
  });

  it('re-derives the preset when a size changes', () => {
    const all = { labelWidthMm: 50, labelHeightMm: 30, labelColumns: 1 };
    expect(syncPresetFields({ labelWidthMm: 50 }, all)).toEqual({
      labelPreset: '50x30x1',
    });
    expect(
      syncPresetFields({ labelColumns: 2 }, { ...all, labelColumns: 2 })
    ).toEqual({ labelPreset: CUSTOM_PRESET });
    expect(syncPresetFields({ labelShowPrice: false }, all)).toBeNull();
  });
});

describe('toPrinterOptions', () => {
  const printers = [
    { name: 'XP-58', displayName: 'XP-58', isDefault: true },
    { name: 'Xprinter_365B', displayName: 'Xprinter 365B', isDefault: false },
  ];

  it('starts with the default printer, then the installed ones', () => {
    expect(toPrinterOptions(printers, '')).toEqual([
      { value: '', label: 'Máy in mặc định' },
      { value: 'XP-58', label: 'XP-58 (mặc định)' },
      { value: 'Xprinter_365B', label: 'Xprinter 365B' },
    ]);
  });

  it('keeps a saved printer that is not installed', () => {
    expect(toPrinterOptions(printers, 'Old printer').at(-1)).toEqual({
      value: 'Old printer',
      label: 'Old printer (không tìm thấy)',
    });
    expect(toPrinterOptions(printers, 'XP-58')).toHaveLength(3);
  });

  it('shows the saved name as is on the web (no printer list)', () => {
    expect(toPrinterOptions(null, 'XP-58')).toEqual([
      { value: '', label: 'Máy in mặc định' },
      { value: 'XP-58', label: 'XP-58' },
    ]);
  });
});

describe('omitDesignerSettings', () => {
  it('drops the designer keys so printer forms never overwrite them', () => {
    const settings = omitDesignerSettings(fromPrintFormValues({}));
    DESIGNER_KEYS.forEach((key) => expect(settings).not.toHaveProperty(key));
    expect(settings).toHaveProperty('receiptPaper', 'auto');
    expect(settings).toHaveProperty('labelColumns', 2);
  });
});

describe('pickSettings', () => {
  it('keeps only the named settings (a form that saves one field)', () => {
    const settings = fromPrintFormValues({ documentPrinterName: ' Canon ' });
    expect(pickSettings(settings, ['documentPrinterName'])).toEqual({
      documentPrinterName: 'Canon',
    });
  });

  it('keeps everything without names', () => {
    expect(pickSettings({ a: 1 })).toEqual({ a: 1 });
  });
});

describe('form field ownership', () => {
  it('splits every print setting between the forms exactly once', () => {
    const owned = [
      ...RECEIPT_FORM_NAMES,
      ...DOCUMENT_FORM_NAMES,
      ...LABEL_FORM_NAMES,
      ...PURCHASE_FORM_NAMES,
      ...DESIGNER_KEYS,
    ];
    expect(new Set(owned).size).toBe(owned.length);
    expect([...owned].sort()).toEqual(
      Object.keys(PRINT_DEFAULT_SETTINGS).sort()
    );
  });

  it('lets the purchase form own the F8 print options', () => {
    expect(PURCHASE_FORM_NAMES).toEqual([
      'purchasePrintSlip',
      'autoPrintLabelsOnPurchase',
    ]);
    expect(LABEL_FORM_NAMES).not.toContain('autoPrintLabelsOnPurchase');
  });
});
