import { create } from 'zustand';
import {
  addItem,
  bulkAdd,
  deleteItem,
  getAll,
  updateItem,
} from '../db/repository.js';

export const createCrudStore = (table, options = {}) =>
  create((set, get) => {
    const { includeDeleted = false, extend } = options;

    const baseStore = {
      items: [],
      load: async (loadOptions = {}) => {
        const data = await getAll(table, {
          includeDeleted: loadOptions.includeDeleted ?? includeDeleted,
        });
        set({ items: data });
        return data;
      },
      add: async (item) => {
        const data = await addItem(table, item);
        await get().load();
        return data;
      },
      update: async (id, data) => {
        const updated = await updateItem(table, id, data);
        await get().load();
        return updated;
      },
      remove: async (id) => {
        const removed = await deleteItem(table, id);
        await get().load();
        return removed;
      },
      bulkAdd: async (items) => {
        const data = await bulkAdd(table, items);
        await get().load();
        return data;
      },
    };

    return {
      ...baseStore,
      ...(typeof extend === 'function' ? extend(set, get, baseStore) : {}),
    };
  });
