import { describe, expect, it } from 'vitest';
import {
  buildInvoiceItems,
  buildInvoiceProfitFinancials,
  buildInvoiceSummary,
  buildProfitRows,
  compareDatedRecordsNewestFirst,
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
      costUnit: 60,
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

describe('reportHelpers date sorting', () => {
  it('sorts dated report records newest first', () => {
    const rows = [
      { id: 'old', date: '2026-06-10T00:00:00.000Z' },
      { id: 'new', date: '2026-06-12T00:00:00.000Z' },
      { id: 'middle', date: '2026-06-11T00:00:00.000Z' },
    ];

    expect(
      rows.sort(compareDatedRecordsNewestFirst).map((row) => row.id)
    ).toEqual(['new', 'middle', 'old']);
  });
});

describe('packaging-unit lines', () => {
  const cartonInvoice = {
    id: 'inv-2',
    date: '2026-10-29T00:00:00.000Z',
    items: [
      {
        productId: 'p1',
        qty: 2,
        unitName: 'thùng',
        factor: 24,
        unitPrice: 220000,
        lineTotal: 440000,
        costPriceSnapshot: 8000,
      },
    ],
  };
  const productMap = { p1: { id: 'p1', name: 'Coca', unit: 'lon' } };

  it('computes cost from base quantity', () => {
    expect(buildInvoiceProfitFinancials(cartonInvoice, productMap)).toEqual({
      revenue: 440000,
      cost: 384000,
      profit: 56000,
    });
  });

  it('shows the line unit and base quantity', () => {
    expect(buildInvoiceItems(cartonInvoice, productMap)[0]).toMatchObject({
      unit: 'thùng',
      qty: 2,
      baseUnit: 'lon',
      baseQty: 48,
      costUnit: 192000,
      costTotal: 384000,
    });
  });
});
