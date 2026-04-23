import { create } from 'zustand';
import { getSettings, saveSettings } from '../db/repository.js';
import { DEFAULT_TEMPLATE } from '../features/settings/templates/defaultInvoiceTemplate.js';

export const DEFAULT_SETTINGS = {
  id: 'main',
  shopName: 'Cửa hàng nhôm kính',
  shopPhone: '0900 000 000',
  shopAddress: '123 Đường ABC, Quận 1',
  allowNegativeStock: false,
  showSensitiveInfo: false,
  lowStockThreshold: 5,
  printCopies: 1,
  invoiceTemplateHtml: DEFAULT_TEMPLATE,
  dataVersion: 2,
};

const normalizeSettings = (data) => {
  const hasExistingData = Boolean(data);
  const hasDataVersion = Object.prototype.hasOwnProperty.call(
    data || {},
    'dataVersion'
  );
  const normalized = { ...DEFAULT_SETTINGS, ...(data || {}) };
  if (hasExistingData && !hasDataVersion) {
    normalized.dataVersion = 0;
  }
  if (!normalized.invoiceTemplateHtml) {
    normalized.invoiceTemplateHtml = DEFAULT_TEMPLATE;
  }
  const copies = Number(normalized.printCopies || 0);
  normalized.printCopies =
    Number.isFinite(copies) && copies > 0
      ? Math.round(copies)
      : DEFAULT_SETTINGS.printCopies;
  return normalized;
};

export const useSettingsStore = create((set, get) => ({
  settings: DEFAULT_SETTINGS,
  load: async () => {
    const data = await getSettings();
    if (data) {
      set({ settings: normalizeSettings(data) });
    }
  },
  ensureDefaults: async () => {
    const data = await getSettings();
    if (!data) {
      await saveSettings(DEFAULT_SETTINGS);
      set({ settings: DEFAULT_SETTINGS });
    }
  },
  update: async (partial) => {
    const next = normalizeSettings({ ...get().settings, ...partial });
    await saveSettings(next);
    set({ settings: next });
  },
  reset: async () => {
    await saveSettings(DEFAULT_SETTINGS);
    set({ settings: DEFAULT_SETTINGS });
  },
}));
