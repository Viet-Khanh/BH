import { describe, expect, it } from 'vitest';
import {
  buildInvoiceItems,
  buildInvoiceProfitFinancials,
  buildInvoiceSummary,
  buildProfitRows,
  computeInvoiceCost,
} from '../reportHelpers.js';

const invoice = {
  id: 'invoice-1',
  code: 'INV-1',
  date: '2026-06-12T00:00:00.000Z',
  customerId: 'customer-1',
  total: 150,
  items: [
    {
      productId: 'p1',
      qty: 1,
      unitPrice: 100,
      lineTotal: 100,
      costPriceSnapshot: 60,
      excludeFromProfitSnapshot: false,
    },
    {
      productId: 'p2',
      qty: 1,
      unitPrice: 50,
      lineTotal: 50,
      costPriceSnapshot: 10,
      excludeFromProfitSnapshot: true,
    },
  ],
};

describe('reportHelpers profit exclusion', () => {
  it('keeps invoice amount but excludes flagged lines from profit', () => {
    const summary = buildInvoiceSummary(invoice, {
      customerMap: { 'customer-1': { name: 'Khách hàng' } },
      productMap: {},
      paymentsByInvoice: {},
      oldDebtByInvoice: {},
    });

    expect(summary.amount).toBe(150);
    expect(summary.profit).toBe(40);
    expect(computeInvoiceCost(invoice)).toBe(60);
    expect(buildInvoiceProfitFinancials(invoice)).toEqual({
      revenue: 100,
      cost: 60,
      profit: 40,
    });
  });

  it('sets item-level profit values to zero for excluded lines', () => {
    const items = buildInvoiceItems(invoice, {
      p1: { name: 'Sản phẩm A' },
      p2: { name: 'Thu hộ' },
    });

    expect(items[0]).toMatchObject({
      lineTotal: 100,
      costTotal: 60,
      profit: 40,
    });
    expect(items[1]).toMatchObject({
      lineTotal: 50,
      costTotal: 0,
      profit: 0,
      excludedFromProfit: true,
    });
  });

  it('excludes flagged lines from profit report revenue and cost', () => {
    expect(buildProfitRows([invoice])).toEqual([
      {
        date: '2026-06-12',
        revenue: 100,
        cost: 60,
        profit: 40,
      },
    ]);
  });
});
