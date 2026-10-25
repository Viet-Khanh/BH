import { create } from 'zustand';
import { getSettings, saveSettings } from '../db/repository.js';
import { getDefaultSettings } from './settingsDefaults.js';

const normalizeSettings = (data) => {
  const defaults = getDefaultSettings();
  const hasExistingData = Boolean(data);
  const hasDataVersion = Object.prototype.hasOwnProperty.call(
    data || {},
    'dataVersion'
  );
  const normalized = { ...defaults, ...(data || {}) };
  if (hasExistingData && !hasDataVersion) {
    normalized.dataVersion = 0;
  }
  if (!normalized.invoiceTemplateHtml) {
    normalized.invoiceTemplateHtml = defaults.invoiceTemplateHtml;
  }
  const copies = Number(normalized.printCopies || 0);
  normalized.printCopies =
    Number.isFinite(copies) && copies > 0
      ? Math.round(copies)
      : defaults.printCopies;
  return normalized;
};

const saveDefaults = async (set) => {
  const defaults = getDefaultSettings();
  await saveSettings(defaults);
  set({ settings: defaults });
};

export const useSettingsStore = create((set, get) => ({
  // Placeholder until load(); real values come from the API.
  settings: getDefaultSettings(),
  load: async () => {
    const data = await getSettings();
    if (data) {
      set({ settings: normalizeSettings(data) });
    }
  },
  ensureDefaults: async () => {
    const data = await getSettings();
    if (!data) await saveDefaults(set);
  },
  update: async (partial) => {
    const next = normalizeSettings({ ...get().settings, ...partial });
    await saveSettings(next);
    set({ settings: next });
  },
  reset: () => saveDefaults(set),
}));
