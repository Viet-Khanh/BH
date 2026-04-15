import { createCrudStore } from './createCrudStore.js';

const TABLE = 'suppliers';

export const useSupplierStore = createCrudStore(TABLE, {
  includeDeleted: true,
});
