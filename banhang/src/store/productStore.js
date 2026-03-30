import { create } from 'zustand';
import {
  addItem,
  getAll,
  updateItem,
  deleteItem,
  bulkAdd,
  bulkUpdateProductPricesByName,
} from '../db/repository.js';

const TABLE = 'products';

export const useProductStore = create((set, get) => ({
  items: [],
  load: async () => {
    const data = await getAll(TABLE, { includeDeleted: true });
    set({ items: data });
  },
  add: async (item) => {
    await addItem(TABLE, item);
    await get().load();
  },
  update: async (id, data) => {
    await updateItem(TABLE, id, data);
    await get().load();
  },
  remove: async (id) => {
    await deleteItem(TABLE, id);
    await get().load();
  },
  bulkAdd: async (items) => {
    await bulkAdd(TABLE, items);
    await get().load();
  },
  bulkUpdatePricesByName: async (items) => {
    const result = await bulkUpdateProductPricesByName(items);
    await get().load();
    return result;
  },
}));
