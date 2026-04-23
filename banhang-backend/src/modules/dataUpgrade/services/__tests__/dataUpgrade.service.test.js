import { describe, expect, it } from 'vitest';
import {
  buildCustomerDebtSnapshot,
  buildDataReconcileReport,
  buildDataUpgradePreview,
  buildStockSnapshot,
} from '../dataUpgrade.service.js';

describe('dataUpgrade.service snapshot builders', () => {
  it('computes product stock from opening stock, pending purchases, and sales', () => {
    const stock = buildStockSnapshot({
      products: [
        { id: 'p1', openingStock: 10 },
        { id: 'p2', openingStock: 5 },
      ],
      purchases: [
        {
          id: 'po1',
          appliedToStock: false,
          items: [{ productId: 'p1', qty: 4 }],
        },
        {
          id: 'po2',
          appliedToStock: true,
          items: [{ productId: 'p1', qty: 8 }],
        },
      ],
      invoices: [
        { id: 'i1', items: [{ productId: 'p1', qty: 3 }] },
        { id: 'i2', items: [{ productId: 'p2', qty: 7 }] },
      ],
    });

    expect(stock).toEqual({ p1: 11, p2: -2 });
  });

  it('computes customer debt from invoices and customer payments', () => {
    const debt = buildCustomerDebtSnapshot({
      customers: [{ id: 'c1' }, { id: 'c2' }],
      invoices: [
        { id: 'i1', customerId: 'c1', total: 1000 },
        { id: 'i2', customerId: 'c2', total: 500 },
      ],
      payments: [
        { id: 'p1', invoiceId: 'i1', amount: 300 },
        {
          id: 'p2',
          customerId: 'c1',
          paymentType: 'debt_receipt',
          amount: 200,
        },
        {
          id: 'p3',
          customerId: 'c2',
          paymentType: 'debt_receipt',
          amount: 700,
        },
      ],
    });

    expect(debt).toEqual({ c1: 500, c2: -200 });
  });

  it('builds preview summary and warning lists', () => {
    const preview = buildDataUpgradePreview({
      settings: { dataVersion: 1 },
      products: [
        { id: 'p1', code: 'P1', name: 'Hàng A', openingStock: 1, stock: 9 },
      ],
      purchases: [],
      invoices: [
        {
          id: 'i1',
          customerId: 'c1',
          total: 100,
          items: [{ productId: 'p1', qty: 3 }],
        },
      ],
      customers: [{ id: 'c1', name: 'Khách A', currentDebt: 0 }],
      payments: [],
    });

    expect(preview.summary.negativeStockCount).toBe(1);
    expect(preview.summary.debtorCount).toBe(1);
    expect(preview.summary.stockChangedCount).toBe(1);
    expect(preview.summary.debtChangedCount).toBe(1);
    expect(preview.negativeStockProducts[0].stock).toBe(-2);
    expect(preview.debtorCustomers[0].debt).toBe(100);
  });

  it('builds reconcile summary and mismatch rows', () => {
    const report = buildDataReconcileReport({
      settings: { dataVersion: 2 },
      products: [
        { id: 'p1', code: 'P1', name: 'Hàng A', openingStock: 5, stock: 2 },
        { id: 'p2', code: 'P2', name: 'Hàng B', openingStock: 3, stock: 3 },
      ],
      purchases: [],
      invoices: [
        {
          id: 'i1',
          customerId: 'c1',
          total: 500,
          items: [{ productId: 'p1', qty: 1 }],
        },
      ],
      customers: [
        { id: 'c1', name: 'Khách A', currentDebt: 100 },
        { id: 'c2', name: 'Khách B', currentDebt: 0 },
      ],
      payments: [],
    });

    expect(report.stock).toMatchObject({
      checked: 2,
      matched: 1,
      mismatched: 1,
      totalDiff: 2,
    });
    expect(report.debt).toMatchObject({
      checked: 2,
      matched: 1,
      mismatched: 1,
      totalDiff: 400,
    });
    expect(report.stock.rows[0]).toMatchObject({
      productId: 'p1',
      snapshotStock: 2,
      computedStock: 4,
      diff: 2,
    });
    expect(report.debt.rows[0]).toMatchObject({
      customerId: 'c1',
      snapshotDebt: 100,
      computedDebt: 500,
      diff: 400,
    });
  });
});
