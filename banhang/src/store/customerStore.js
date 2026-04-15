import { v4 as uuid } from 'uuid';
import { addItem } from '../db/repository.js';
import { createCrudStore } from './createCrudStore.js';

const TABLE = 'customers';

export const useCustomerStore = createCrudStore(TABLE, {
  includeDeleted: true,
  extend: (set, get) => ({
    ensureDefaultCustomer: async () => {
      const data = await get().load({ includeDeleted: true });
      const exists = data.find(
        (item) =>
          !item.isDeleted &&
          (item.name === 'Khách lẻ' || item.name === 'Khach le')
      );
      if (!exists) {
        await addItem(TABLE, {
          id: uuid(),
          name: 'Khách lẻ',
          phone: '',
          address: '',
        });
        await get().load({ includeDeleted: true });
      }
    },
  }),
});
