import { createCrudStore } from './createCrudStore.js';

const TABLE = 'units';

export const useUnitStore = createCrudStore(TABLE, {
  includeDeleted: true,
});
