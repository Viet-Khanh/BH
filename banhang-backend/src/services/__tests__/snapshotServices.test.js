import { describe, expect, it } from 'vitest';
import {
  buildInvoiceCreateStockDeltas,
  buildInvoiceDeleteStockDeltas,
  buildItemUpdateStockDeltas,
  buildPurchaseStockDeltas,
} from '../stockSnapshot.service.js';
import {
  buildInvoiceDebtDelta,
  buildPaymentDebtDelta,
  invertDebtDeltas,
} from '../customerDebtSnapshot.service.js';

describe('snapshot delta helpers', () => {
  it('builds stock deltas for invoice create, update, delete, and purchase', () => {
    expect(
      buildInvoiceCreateStockDeltas([
        { productId: 'p1', qty: 2 },
        { productId: 'p1', qty: 3 },
      ])
    ).toEqual([{ productId: 'p1', delta: -5 }]);

    expect(
      buildItemUpdateStockDeltas(
        [{ productId: 'p1', qty: 5 }],
        [
          { productId: 'p1', qty: 2 },
          { productId: 'p2', qty: 1 },
        ]
      )
    ).toEqual([
      { productId: 'p1', delta: 3 },
      { productId: 'p2', delta: -1 },
    ]);

    expect(
      buildInvoiceDeleteStockDeltas([{ productId: 'p1', qty: 4 }])
    ).toEqual([{ productId: 'p1', delta: 4 }]);
    expect(buildPurchaseStockDeltas([], [{ productId: 'p1', qty: 4 }])).toEqual(
      [{ productId: 'p1', delta: 4 }]
    );
  });

  it('builds customer debt deltas for invoices and payments', () => {
    const invoiceDelta = buildInvoiceDebtDelta({
      customerId: 'c1',
      total: 1000,
    });
    const paymentDelta = buildPaymentDebtDelta({
      customerId: 'c1',
      paymentType: 'invoice_payment',
      amount: 300,
    });

    expect(invoiceDelta).toEqual([{ customerId: 'c1', delta: 1000 }]);
    expect(paymentDelta).toEqual([{ customerId: 'c1', delta: -300 }]);
    expect(invertDebtDeltas([...invoiceDelta, ...paymentDelta])).toEqual([
      { customerId: 'c1', delta: -700 },
    ]);
  });
});
