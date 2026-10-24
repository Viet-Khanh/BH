import { KEY_ROOT, META_KEY, SCHEMA_VERSION } from '../config.js';
import { getStorage, removeKeysWithPrefix } from '../db/localStore.js';

const emptyMeta = () => ({
  schemaVersion: SCHEMA_VERSION,
  activeEdition: null,
  editions: {},
});

export const readMeta = () => {
  try {
    const parsed = JSON.parse(getStorage().getItem(META_KEY) || 'null');
    return parsed && typeof parsed === 'object'
      ? { ...emptyMeta(), ...parsed }
      : emptyMeta();
  } catch {
    return emptyMeta();
  }
};

const writeMeta = (meta) =>
  getStorage().setItem(META_KEY, JSON.stringify(meta));

const updateMeta = (updater) => {
  const next = updater(readMeta());
  writeMeta(next);
  return next;
};

// Returns true when stored data came from another schema version and was wiped.
export const ensureSchemaVersion = () => {
  if (readMeta().schemaVersion === SCHEMA_VERSION) return false;
  removeKeysWithPrefix(`${KEY_ROOT}:`);
  writeMeta(emptyMeta());
  return true;
};

export const setActiveEdition = (editionId) =>
  updateMeta((meta) => ({ ...meta, activeEdition: editionId }));

export const markEditionSeeded = (editionId) =>
  updateMeta((meta) => ({
    ...meta,
    editions: {
      ...meta.editions,
      [editionId]: { seededAt: new Date().toISOString() },
    },
  }));

export const isEditionSeeded = (editionId) =>
  Boolean(readMeta().editions[editionId]?.seededAt);
