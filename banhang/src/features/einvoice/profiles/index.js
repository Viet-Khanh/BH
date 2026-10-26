import easyinvoice from './easyinvoice.js';
import generic from './generic.js';
import genericAdjust from './genericAdjust.js';
import minvoice from './minvoice.js';
import misa from './misa.js';
import viettel from './viettel.js';

// Built-in export formats (data, see ../domain/applyProfile.js). Provider
// presets follow public documentation (`source`); shops can also build their
// own from the provider's template file (settings.einvoiceCustomProfiles).
export const BUILT_IN_PROFILES = [
  generic,
  viettel,
  misa,
  easyinvoice,
  minvoice,
  genericAdjust,
];

export const DEFAULT_PROFILE_ID = generic.id;
export const DEFAULT_ADJUST_PROFILE_ID = genericAdjust.id;

const FALLBACK = { issue: generic, adjust: genericAdjust };

export const allProfiles = (settings = {}) => [
  ...BUILT_IN_PROFILES,
  ...(settings.einvoiceCustomProfiles || []).map((profile) => ({
    ...profile,
    custom: true,
  })),
];

export const listProfiles = (settings, purpose = 'issue') =>
  allProfiles(settings).filter(
    (profile) => (profile.purpose || 'issue') === purpose
  );

export const getProfile = (profileId, settings, purpose = 'issue') =>
  listProfiles(settings, purpose).find((profile) => profile.id === profileId) ||
  FALLBACK[purpose];

export const profileOptions = (settings, purpose) =>
  listProfiles(settings, purpose).map(({ id, name, custom }) => ({
    value: id,
    label: custom ? `${name} (tự tạo)` : name,
  }));
