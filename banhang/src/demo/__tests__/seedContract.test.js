import { beforeAll, describe, expect, it } from 'vitest';
import { getBaseQty } from '../../utils/productUnits.js';
import { dispatch } from '../demoApp.js';
import { configureStorage, setActiveNamespace } from '../db/localStore.js';
import { DEMO_EDITIONS } from '../editions/index.js';
import { ean13 } from '../seed/ean13.js';
import { seedEdition } from '../seed/seedEdition.js';
import { createMemoryStorage } from './helpers/memoryStorage.js';

const get = async (path) => {
  const { status, data } = await dispatch({ path: `/api${path}` });
  expect(status, `${path} -> ${data?.message}`).toBe(200);
  return data;
};

const sumBy = (list, pick) => list.reduce((sum, item) => sum + pick(item), 0);

describe.each(DEMO_EDITIONS)('seeded edition $id', (edition) => {
  beforeAll(async () => {
    configureStorage(createMemoryStorage());
    setActiveNamespace(edition.id);
    await seedEdition(edition.id, { dispatch });
  }, 30000);

  it('creates master data and a month of transactions', async () => {
    expect(await get('/products')).toHaveLength(edition.products.length);
    expect(await get('/customers')).toHaveLength(edition.customers.length);
    expect((await get('/invoices')).length).toBeGreaterThanOrEqual(25);
    expect((await get('/purchases')).length).toBeGreaterThanOrEqual(8);
    expect((await get('/settings/main')).dataVersion).toBe(2);
  });

  it('keeps stock consistent with purchases and sales', async () => {
    const products = await get('/products');
    const invoices = await get('/invoices');
    products.forEach((product) => {
      const sold = sumBy(
        invoices.flatMap((invoice) => invoice.items),
        (item) => (item.productId === product.id ? getBaseQty(item) : 0)
      );
      expect(product.stock).toBeGreaterThanOrEqual(0);
      expect(product.stock).toBe(product.openingStock - sold);
    });
  });

  it('seeds packaging units for the minimart', async () => {
    if (edition.id !== 'minimart') return;
    const products = await get('/products');
    const invoices = await get('/invoices');
    expect(products.some((product) => product.units?.length)).toBe(true);
    expect(
      invoices.some((invoice) => invoice.items.some((item) => item.unitName))
    ).toBe(true);
  });

  it('seeds unique valid EAN-13 barcodes only for the minimart', async () => {
    const products = await get('/products');
    const codes = products.flatMap((product) => [
      product.barcode,
      ...(product.units || []).map((unit) => unit.barcode),
    ]);
    if (edition.id !== 'minimart') {
      expect(codes.some(Boolean)).toBe(false);
      return;
    }
    expect(codes.every((code) => /^\d{13}$/.test(code))).toBe(true);
    expect(new Set(codes).size).toBe(codes.length);
    codes.forEach((code) => expect(ean13(code.slice(0, 12))).toBe(code));
  });

  it('keeps customer debt consistent with invoices and payments', async () => {
    const customers = await get('/customers');
    const invoices = await get('/invoices');
    const payments = await get('/payments');
    customers.forEach((customer) => {
      const billed = sumBy(invoices, (invoice) =>
        invoice.customerId === customer.id ? invoice.total : 0
      );
      const paid = sumBy(payments, (payment) =>
        payment.customerId === customer.id ? payment.amount : 0
      );
      expect(customer.currentDebt).toBe(billed - paid);
    });
    expect(customers.some((customer) => customer.currentDebt > 0)).toBe(true);
  });

  it('serves dashboard and reports', async () => {
    await get('/dashboard/today');
    await get('/reports/stock');
    await get('/reports/debt');
    await get('/reports/profit');
    await get('/reports/cash');
    await get('/purchases-tools/recent?limit=20');
    await get('/sales/products?limit=10');
  });
});
