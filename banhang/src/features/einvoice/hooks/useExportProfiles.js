import { useEffect, useState } from 'react';
import {
  DEFAULT_ADJUST_PROFILE_ID,
  DEFAULT_PROFILE_ID,
  profileOptions,
} from '../profiles/index.js';

// Chosen export profile per purpose, starting from the shop's defaults.
export const useExportProfiles = (settings) => {
  const [chosen, setChosen] = useState({});

  useEffect(() => {
    setChosen({
      issue: settings.einvoiceProfile || DEFAULT_PROFILE_ID,
      adjust: settings.einvoiceAdjustProfile || DEFAULT_ADJUST_PROFILE_ID,
    });
  }, [settings.einvoiceProfile, settings.einvoiceAdjustProfile]);

  return {
    profileIdFor: (purpose) => chosen[purpose],
    optionsFor: (purpose) => profileOptions(settings, purpose),
    choose: (purpose, profileId) =>
      setChosen((previous) => ({ ...previous, [purpose]: profileId })),
  };
};
