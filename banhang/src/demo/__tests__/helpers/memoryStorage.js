// Web Storage compatible in-memory store for tests. quotaBytes simulates a full localStorage.
export const createMemoryStorage = ({ quotaBytes = Infinity } = {}) => {
  const data = new Map();
  const usedBytes = () =>
    [...data.values()].reduce((sum, value) => sum + value.length, 0);

  return {
    get length() {
      return data.size;
    },
    key: (index) => [...data.keys()][index] ?? null,
    getItem: (key) => (data.has(key) ? data.get(key) : null),
    setItem: (key, value) => {
      const text = String(value);
      const previous = data.get(key)?.length || 0;
      if (usedBytes() - previous + text.length > quotaBytes) {
        const error = new Error('Quota exceeded');
        error.name = 'QuotaExceededError';
        throw error;
      }
      data.set(key, text);
    },
    removeItem: (key) => {
      data.delete(key);
    },
    clear: () => data.clear(),
  };
};
