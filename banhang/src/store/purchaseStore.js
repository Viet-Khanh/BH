import { createCrudStore } from './createCrudStore.js';

const TABLE = 'purchases';

export const usePurchaseStore = createCrudStore(TABLE);
