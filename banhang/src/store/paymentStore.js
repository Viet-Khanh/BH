import { createCrudStore } from './createCrudStore.js';

const TABLE = 'payments';

export const usePaymentStore = createCrudStore(TABLE);
