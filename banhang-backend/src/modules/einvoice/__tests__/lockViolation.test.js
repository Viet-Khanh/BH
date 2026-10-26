import { describe, expect, it } from 'vitest';
import { lockViolation } from '../domain/contentChange.js';

const invoice = {
  id: 'i1',
  customerId: 'c1',
  date: '2026-10-26T03:00:00.000Z',
  items: [{ productId: 'p1', qty: 2, unitPrice: 11000, lineTotal: 22000 }],
  total: 22000,
};

describe('lockViolation', () => {
  const exported = { ...invoice, einvoice: { exportedAt: '2026-10-26' } };
  const locked = { einvoiceLockExported: true };

  it('refuses content edits and deletes of exported invoices when locked', () => {
    const edited = { ...exported, total: 1 };
    expect(lockViolation(exported, edited, locked)).toMatch('không sửa được');
    expect(lockViolation(exported, null, locked)).toMatch('không xoá được');
  });

  it('allows payment-only changes, unlocked shops and pending invoices', () => {
    const paid = { ...exported, paymentStatus: 'DA THU' };
    expect(lockViolation(exported, paid, locked)).toBeNull();
    expect(lockViolation(exported, null, {})).toBeNull();
    expect(lockViolation(invoice, null, locked)).toBeNull();
  });
});
