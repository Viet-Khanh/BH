import { create } from 'zustand';
import { addItem, getAll, updateItem, deleteItem, bulkAdd } from '../db/repository.js';
import { v4 as uuid } from 'uuid';

const TABLE = 'customers';

export const useCustomerStore = create((set, get) => ({
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
  ensureDefaultCustomer: async () => {
    const data = await getAll(TABLE, { includeDeleted: true });
    const exists = data.find(
      (item) =>
        !item.isDeleted && (item.name === 'Khách lẻ' || item.name === 'Khach le')
    );
    if (!exists) {
      await addItem(TABLE, { id: uuid(), name: 'Khách lẻ', phone: '', address: '' });
      await get().load();
    }
  },
}));
