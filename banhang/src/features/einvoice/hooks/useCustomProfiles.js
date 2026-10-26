import { message } from 'antd';
import { useCallback } from 'react';
import { useSettingsStore } from '../../../store/settingsStore.js';
import { saveDraft } from '../domain/profileDraft.js';
import {
  DEFAULT_ADJUST_PROFILE_ID,
  DEFAULT_PROFILE_ID,
} from '../profiles/index.js';

// Custom export profiles live in settings.einvoiceCustomProfiles.
export const useCustomProfiles = () => {
  const { settings, update } = useSettingsStore();
  const profiles = settings.einvoiceCustomProfiles || [];

  const save = useCallback(
    async (draft) => {
      await update({ einvoiceCustomProfiles: saveDraft(profiles, draft) });
      message.success(`Đã lưu mẫu "${draft.name}".`);
    },
    [profiles, update]
  );

  // Defaults pointing to a removed profile fall back to the built-ins.
  const remove = useCallback(
    async (profileId) => {
      await update({
        einvoiceCustomProfiles: profiles.filter((p) => p.id !== profileId),
        ...(settings.einvoiceProfile === profileId
          ? { einvoiceProfile: DEFAULT_PROFILE_ID }
          : {}),
        ...(settings.einvoiceAdjustProfile === profileId
          ? { einvoiceAdjustProfile: DEFAULT_ADJUST_PROFILE_ID }
          : {}),
      });
    },
    [profiles, settings, update]
  );

  return { settings, save, remove };
};
