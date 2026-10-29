// Bump SCHEMA_VERSION when stored demo data shape changes: all demo keys are wiped and reseeded.
export const SCHEMA_VERSION = 3;
export const KEY_ROOT = 'bh-demo';
export const META_KEY = `${KEY_ROOT}:meta`;
export const DATA_KEY_PREFIX = `${KEY_ROOT}:v${SCHEMA_VERSION}`;
export const SEED_DAYS = 30;
export const DEMO_SYSTEM_PASSWORD = '123456';
export const CONTACT_URL = import.meta.env.VITE_CONTACT_URL || '';
