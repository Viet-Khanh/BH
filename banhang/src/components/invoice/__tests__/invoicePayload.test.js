import { describe, expect, it } from 'vitest';
import { buildInvoicePayload } from '../invoicePayload.js';

describe('buildInvoicePayload', () => {
  it('snapshots product profit exclusion into invoice items', () => {
    const payload = buildInvoicePayload({
      items: [{ productId: 'p1', qty: 1, unitPrice: 100, lineTotal: 100 }],
      products: [{ id: 'p1', avgCost: 20, excludeFromProfit: true }],
      invoice: null,
      draftCode: 'INV-1',
      customerId: 'customer-1',
      defaultCustomerId: 'default-customer',
      date: '2026-06-12T00:00:00.000Z',
      totals: { subTotal: 100, total: 100 },
      status: 'CHUA THU',
      note: '',
    });

    expect(payload.items[0]).toMatchObject({
      costPriceSnapshot: 20,
      excludeFromProfitSnapshot: true,
    });
  });
});
