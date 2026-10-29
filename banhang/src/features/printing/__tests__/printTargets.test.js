import { beforeEach, describe, expect, it, vi } from 'vitest';

const printHtml = vi.hoisted(() => vi.fn());
const store = vi.hoisted(() => ({ settings: {} }));
vi.mock('../../../utils/printUtils.js', () => ({ printHtml }));
vi.mock('../../../store/settingsStore.js', () => ({
  useSettingsStore: { getState: () => store },
}));

const { getPrinterFor, printDocument } = await import('../printTargets.js');

const settings = {
  receiptPrinterName: ' XP-58 ',
  documentPrinterName: 'Canon LBP',
  labelPrinterName: 'Xprinter 365B',
};

describe('getPrinterFor', () => {
  it('routes each target to its own printer', () => {
    expect(getPrinterFor(settings, 'receipt')).toBe('XP-58');
    expect(getPrinterFor(settings, 'document')).toBe('Canon LBP');
    expect(getPrinterFor(settings, 'label')).toBe('Xprinter 365B');
  });

  it('falls back to the system default printer', () => {
    expect(getPrinterFor({}, 'document')).toBe('');
    expect(getPrinterFor(null, 'receipt')).toBe('');
    expect(getPrinterFor(settings, 'unknown')).toBe('');
  });
});

describe('printDocument', () => {
  beforeEach(() => {
    printHtml.mockReset();
    store.settings = settings;
  });

  it('prints on the document printer from the settings store', async () => {
    await printDocument('<p>a4</p>', { copies: 2, autoPageSize: true });
    expect(printHtml).toHaveBeenCalledWith('<p>a4</p>', {
      copies: 2,
      autoPageSize: true,
      deviceName: 'Canon LBP',
    });
  });

  it('keeps the print dialog free to choose', async () => {
    await printDocument('<p>a4</p>', { copies: 1, forceDialog: true });
    expect(printHtml).toHaveBeenCalledWith('<p>a4</p>', {
      copies: 1,
      forceDialog: true,
    });
  });
});
