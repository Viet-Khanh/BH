import { createCrudStore } from './createCrudStore.js';

const TABLE = 'invoices';

export const useInvoiceStore = createCrudStore(TABLE);
