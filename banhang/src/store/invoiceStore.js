import { create } from 'zustand';
import { addItem, getAll, updateItem, deleteItem, bulkAdd } from '../db/repository.js';

const TABLE = 'invoices';

export const useInvoiceStore = create((set, get) => ({
  items: [],
  load: async () => {
    const data = await getAll(TABLE);
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
}));
