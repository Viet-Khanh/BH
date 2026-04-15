import { createCrudStore } from './createCrudStore.js';

const TABLE = 'cashbook';

export const useCashbookStore = createCrudStore(TABLE);
