import { DATA_KEY_PREFIX } from '../config.js';

let storage = globalThis.localStorage ?? null;
let namespace = null;
const cache = new Map();

export class DemoStorageError extends Error {
  constructor(message) {
    super(message);
    this.name = 'DemoStorageError';
  }
}

export const configureStorage = (nextStorage) => {
  storage = nextStorage;
  cache.clear();
};

export const getStorage = () => {
  if (!storage) {
    throw new DemoStorageError('Trình duyệt không hỗ trợ lưu trữ cục bộ.');
  }
  return storage;
};

export const setActiveNamespace = (editionId) => {
  namespace = editionId;
  cache.clear();
};

export const getActiveNamespace = () => namespace;

const namespacePrefix = (editionId) => `${DATA_KEY_PREFIX}:${editionId}:`;

const collectionKey = (collection) => {
  if (!namespace) throw new DemoStorageError('Chưa chọn ngành hàng demo.');
  return `${namespacePrefix(namespace)}${collection}`;
};

const parseCollection = (key, raw) => {
  if (raw === null) return [];
  let parsed = null;
  try {
    parsed = JSON.parse(raw);
  } catch {
    parsed = null;
  }
  if (!Array.isArray(parsed)) {
    throw new DemoStorageError(`Dữ liệu demo bị hỏng (${key}).`);
  }
  return parsed;
};

const isQuotaError = (error) =>
  error?.name === 'QuotaExceededError' ||
  error?.name === 'NS_ERROR_DOM_QUOTA_REACHED' ||
  error?.code === 22;

// Returned arrays are shared cache: callers must treat them as read-only.
export const readCollection = (collection) => {
  const key = collectionKey(collection);
  if (!cache.has(key)) {
    cache.set(key, parseCollection(key, getStorage().getItem(key)));
  }
  return cache.get(key);
};

// Writes storage first so a failed write leaves the cache (and data) untouched.
export const writeCollection = (collection, docs) => {
  const key = collectionKey(collection);
  try {
    getStorage().setItem(key, JSON.stringify(docs));
  } catch (error) {
    if (isQuotaError(error)) {
      throw new DemoStorageError(
        'Bộ nhớ demo đã đầy. Hãy khôi phục dữ liệu mẫu hoặc xuất Excel rồi xoá bớt dữ liệu.'
      );
    }
    throw error;
  }
  cache.set(key, docs);
};

const listKeys = (prefix) => {
  const target = getStorage();
  const keys = [];
  for (let index = 0; index < target.length; index += 1) {
    const key = target.key(index);
    if (key?.startsWith(prefix)) keys.push(key);
  }
  return keys;
};

export const removeKeysWithPrefix = (prefix) => {
  listKeys(prefix).forEach((key) => getStorage().removeItem(key));
  cache.clear();
};

export const clearNamespace = (editionId) =>
  removeKeysWithPrefix(namespacePrefix(editionId));

export const findCorruptCollections = (editionId) =>
  listKeys(namespacePrefix(editionId)).filter((key) => {
    try {
      parseCollection(key, getStorage().getItem(key));
      return false;
    } catch {
      return true;
    }
  });

export const isStorageAvailable = () => {
  try {
    const probe = `${DATA_KEY_PREFIX}:probe`;
    getStorage().setItem(probe, '1');
    getStorage().removeItem(probe);
    return true;
  } catch {
    return false;
  }
};
