import { describe, expect, it } from 'vitest';
import {
  buildOldDebtByPurchase,
  buildQtyMapFromInvoices,
  buildQtyMapFromItems,
  buildQtyMapFromPurchases,
  sanitizePurchaseItems,
} from '../purchaseHelpers.js';
import { computeStock } from '../stock.js';

describe('purchaseHelpers', () => {
  it('includes standalone supplier debt payments when computing old debt', () => {
    const oldDebtByPurchase = buildOldDebtByPurchase(
      [
        {
          id: 'po1',
          supplierId: 's1',
          date: '2026-05-09T18:08:00.000Z',
          total: 101503900,
        },
      ],
      {},
      [
        {
          id: 'opening-negative',
          supplierId: 's1',
          paymentType: 'supplier_debt_payment',
          date: '2026-05-09T18:00:00.000Z',
          amount: 3615305000,
        },
      ]
    );

    expect(oldDebtByPurchase).toEqual({
      po1: -3615305000,
    });
  });

  it('keeps purchase payments and supplier debt payments in timeline order', () => {
    const oldDebtByPurchase = buildOldDebtByPurchase(
      [
        {
          id: 'po1',
          supplierId: 's1',
          date: '2026-05-09T08:00:00.000Z',
          total: 1000,
        },
        {
          id: 'po2',
          supplierId: 's1',
          date: '2026-05-09T10:00:00.000Z',
          total: 500,
        },
      ],
      {
        po1: 200,
      },
      [
        {
          id: 'debt-pay-1',
          supplierId: 's1',
          paymentType: 'supplier_debt_payment',
          date: '2026-05-09T09:00:00.000Z',
          amount: 300,
        },
      ]
    );

    expect(oldDebtByPurchase).toEqual({
      po1: 0,
      po2: 500,
    });
  });
});

describe('base quantity maps', () => {
  const ids = new Set(['p1']);
  const lines = [
    { productId: 'p1', qty: 2, unitName: 'thùng', factor: 24 },
    { productId: 'p1', qty: 1 },
  ];

  it('sums base quantities', () => {
    expect(buildQtyMapFromItems(lines)).toEqual({ p1: 49 });
    expect(buildQtyMapFromPurchases([{ items: lines }], ids)).toEqual({
      p1: 49,
    });
    expect(buildQtyMapFromInvoices([{ items: lines }], ids)).toEqual({
      p1: 49,
    });
  });

  it('computes stock in base units', () => {
    expect(
      computeStock(
        'p1',
        [{ items: [{ productId: 'p1', qty: 1, factor: 24 }] }],
        [{ items: [{ productId: 'p1', qty: 2, factor: 6 }] }],
        [{ id: 'p1', openingStock: 10 }]
      )
    ).toBe(22);
  });
});

describe('sanitizePurchaseItems', () => {
  it('keeps the unit snapshot of packaging-unit lines', () => {
    const [line] = sanitizePurchaseItems([
      {
        productId: 'p1',
        qty: 2,
        unitCost: 200000,
        unitName: 'thùng',
        factor: 24,
      },
    ]);
    expect(line).toMatchObject({
      productId: 'p1',
      qty: 2,
      unitCost: 200000,
      unitName: 'thùng',
      factor: 24,
      lineTotal: 400000,
    });
  });

  it('adds no unit fields to base-unit lines', () => {
    const [line] = sanitizePurchaseItems([
      { productId: 'p1', qty: 2, unitCost: 5 },
    ]);
    expect(line).not.toHaveProperty('unitName');
    expect(line).not.toHaveProperty('factor');
  });
});
