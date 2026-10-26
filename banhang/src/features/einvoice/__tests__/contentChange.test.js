import { describe, expect, it } from 'vitest';
import { hasContentChange as backendHasContentChange } from '@backend/modules/einvoice/domain/contentChange.js';
import { hasContentChange } from '../domain/contentChange.js';

const base = {
  customerId: 'c1',
  date: '2026-10-26T03:00:00.000Z',
  total: 20000,
  items: [{ productId: 'p1', qty: 2, unitPrice: 10000, lineTotal: 20000 }],
};

const cases = [
  ['same content', base],
  ['payment status only', { ...base, paymentStatus: 'DA THU' }],
  ['numbers as strings', { ...base, total: '20000' }],
  ['quantity', { ...base, items: [{ ...base.items[0], qty: 3 }] }],
  ['line note', { ...base, items: [{ ...base.items[0], lineNote: 'x' }] }],
  ['date', { ...base, date: '2026-10-27T03:00:00.000Z' }],
  ['removed line', { ...base, items: [] }],
  [
    'counter buyer data',
    { ...base, einvoiceRequest: { requested: true, taxCode: '0101' } },
  ],
  ['request not ticked', { ...base, einvoiceRequest: { requested: false } }],
];

describe('hasContentChange (frontend copy)', () => {
  it.each(cases)('matches the backend: %s', (label, after) => {
    expect(hasContentChange(base, after)).toBe(
      backendHasContentChange(base, after)
    );
  });

  it('ignores payment-only changes', () => {
    expect(hasContentChange(base, { ...base, paymentStatus: 'DA THU' })).toBe(
      false
    );
  });
});
