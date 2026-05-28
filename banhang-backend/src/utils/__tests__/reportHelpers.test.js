import { describe, expect, it } from 'vitest';
import { buildSupplierDebtTimeline } from '../reportHelpers.js';

describe('report helper timelines', () => {
  it('builds supplier debt timeline with purchase payments and debt payments', () => {
    const timeline = buildSupplierDebtTimeline({
      purchases: [
        {
          id: 'purchase-1',
          code: 'PN-1',
          date: '2026-01-01T10:00:00.000Z',
          total: 1000,
        },
        {
          id: 'purchase-2',
          code: 'PN-2',
          date: '2026-01-03T10:00:00.000Z',
          total: 500,
        },
      ],
      purchasePayments: [
        {
          id: 'purchase-payment-1',
          purchaseId: 'purchase-1',
          date: '2026-01-02T10:00:00.000Z',
          amount: 300,
        },
      ],
      debtPayments: [
        {
          id: 'debt-payment-1',
          date: '2026-01-04T10:00:00.000Z',
          amount: 400,
        },
      ],
    });

    const debtPaymentRow = timeline.rows.find(
      (row) => row.id === 'supplier-debt-payment:debt-payment-1'
    );

    expect(debtPaymentRow).toMatchObject({
      oldDebt: 1200,
      paid: 400,
      remain: 800,
    });
    expect(timeline.closingBalance).toBe(800);
  });
});
