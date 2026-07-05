import { describe, expect, it } from 'vitest';
import {
  buildCopiedInvoiceDraft,
  buildProductPayload,
  buildCreatedInvoicePayload,
  computePaymentStatus,
  mergeProducts,
  sumPayments,
} from '../salesDomain.js';

describe('salesDomain', () => {
  it('computes payment status correctly', () => {
    expect(computePaymentStatus(100, 0)).toBe('CHUA THU');
    expect(computePaymentStatus(100, 40)).toBe('THU 1 PHAN');
    expect(computePaymentStatus(100, 100)).toBe('DA THU');
  });

  it('sums payments and merges product snapshots by id', () => {
    expect(sumPayments([{ amount: 10 }, { amount: '15' }])).toBe(25);

    expect(
      mergeProducts(
        [{ id: 'p1', name: 'Old Name' }],
        [
          { id: 'p1', name: 'New Name' },
          { id: 'p2', name: 'Other' },
        ]
      )
    ).toEqual([
      { id: 'p1', name: 'New Name' },
      { id: 'p2', name: 'Other' },
    ]);
  });

  it('builds a new invoice payload with default metadata', () => {
    const payload = buildCreatedInvoicePayload({
      id: 'invoice-1',
      data: { total: 50, customerId: 'customer-1' },
    });

    expect(payload.id).toBe('invoice-1');
    expect(payload.customerId).toBe('customer-1');
    expect(payload.paymentStatus).toBe('CHUA THU');
    expect(payload.changeLog).toHaveLength(1);
  });

  it('builds a copied invoice draft without persisted invoice identity', () => {
    const draft = buildCopiedInvoiceDraft(
      {
        id: 'invoice-1',
        code: 'INV-OLD',
        customerId: 'customer-1',
        date: '2026-01-01T00:00:00.000Z',
        note: 'ghi chu',
        paymentStatus: 'DA THU',
        changeLog: [{ note: 'old' }],
        items: [{ productId: 'product-1', qty: 2 }],
      },
      '2026-07-05T00:00:00.000Z'
    );

    expect(draft.id).toBeUndefined();
    expect(draft.code).toBeUndefined();
    expect(draft.customerId).toBe('');
    expect(draft.paymentStatus).toBeUndefined();
    expect(draft.changeLog).toBeUndefined();
    expect(draft.date).toBe('2026-07-05T00:00:00.000Z');
    expect(draft.note).toBe('ghi chu');
    expect(draft.items).toEqual([{ productId: 'product-1', qty: 2 }]);
  });

  it('keeps the product profit exclusion flag when building product payloads', () => {
    const payload = buildProductPayload({
      id: 'product-1',
      buildCodeFromName: () => 'DV',
      values: {
        name: 'Dịch vụ thu hộ',
        unit: 'Lần',
        excludeFromProfit: true,
      },
    });

    expect(payload.excludeFromProfit).toBe(true);
  });
});
