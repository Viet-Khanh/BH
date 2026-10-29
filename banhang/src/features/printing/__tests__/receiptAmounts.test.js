import { describe, expect, it } from 'vitest';
import { getReceiptAmounts } from '../receipt/receiptAmounts.js';

describe('getReceiptAmounts', () => {
  it('computes total, old debt, paid and amount due', () => {
    expect(
      getReceiptAmounts({ total: 455000, customerDebt: 100000 }, [
        { amount: 300000 },
        { amount: '5000' },
      ])
    ).toEqual({ total: 455000, oldDebt: 100000, paid: 305000, due: 250000 });
  });

  it('gives a negative due when the customer paid too much', () => {
    expect(getReceiptAmounts({ total: 1000 }, [{ amount: 1500 }]).due).toBe(
      -500
    );
  });

  it('sums the lines when the invoice has no total', () => {
    const invoice = {
      items: [
        { qty: 2, unitPrice: 1000, lineTotal: 2000 },
        { qty: 1, unitPrice: 500 },
      ],
    };
    expect(getReceiptAmounts(invoice, []).total).toBe(2500);
    expect(getReceiptAmounts(invoice, [], [{ lineTotal: 7 }]).total).toBe(7);
    expect(getReceiptAmounts()).toEqual({
      total: 0,
      oldDebt: 0,
      paid: 0,
      due: 0,
    });
  });
});
