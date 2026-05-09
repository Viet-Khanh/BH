import { describe, expect, it } from 'vitest';
import { buildOldDebtByPurchase } from '../purchaseHelpers.js';

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
