import Dexie from 'dexie';

export const db = new Dexie('banhang-db');

db.version(1).stores({
  products: 'id, group, name, unit, createdAt',
  customers: 'id, name, phone',
  suppliers: 'id, name, phone',
  purchases: 'id, code, supplierId, date',
  invoices: 'id, code, customerId, date, paymentStatus',
  payments: 'id, invoiceId, date',
  cashbook: 'id, date, type',
  settings: 'id',
});
