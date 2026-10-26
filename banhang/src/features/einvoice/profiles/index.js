import generic from './generic.js';

// Export formats. Add a provider: create <provider>.js from its real sample
// import file and list it here (see ../README.md).
export const PROFILES = [generic];

export const DEFAULT_PROFILE_ID = generic.id;

export const getProfile = (profileId) =>
  PROFILES.find((profile) => profile.id === profileId) || generic;
