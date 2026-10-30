import { describe, expect, it } from 'vitest';
import { parseRange } from '../reportHelpers.js';
import {
  buildStockCard,
  buildStockMovementRows,
  getItemArea,
} from '../stockMovement.js';

const product = { id: 'p1', name: 'Tôn lạnh', unit: 'm2', openingStock: 6 };

// openingStock = 5 original + 1 from the applied purchase below.
const purchases = [
  {
    id: 'pn1',
    code: 'PN1',
    supplierId: 's1',
    date: '2026-10-03T03:00:00.000Z',
    appliedToStock: true,
    items: [{ productId: 'p1', qty: 1, length: 10, width: 1.2 }],
  },
];

const invoices = [
  {
    id: 'hd0',
    code: 'HD0',
    customerId: 'c1',
    date: '2026-09-20T03:00:00.000Z',
    items: [{ productId: 'p1', qty: 1 }],
  },
  {
    id: 'hd1',
    code: 'HD1',
    customerId: 'c1',
    date: '2026-10-15T03:00:00.000Z',
    items: [{ productId: 'p1', qty: 2, length: 3, width: 1.2 }],
  },
];

const range = parseRange({
  from: '2026-10-01T00:00:00.000Z',
  to: '2026-10-30T00:00:00.000Z',
});

describe('getItemArea', () => {
  it('multiplies qty by length and width', () => {
    expect(getItemArea({ qty: 2, length: 3, width: 1.2 })).toBeCloseTo(7.2);
  });

  it('returns 0 when a dimension is missing', () => {
    expect(getItemArea({ qty: 2, length: 3 })).toBe(0);
  });
});

describe('buildStockMovementRows', () => {
  it('computes opening, in, out and closing by date range', () => {
    const [row] = buildStockMovementRows({
      products: [product],
      purchases,
      invoices,
      ...range,
    });

    expect(row).toMatchObject({
      openingStock: 4,
      inQty: 1,
      outQty: 2,
      closingStock: 3,
      hasArea: true,
      mixedUnit: true,
    });
    expect(row.inArea).toBeCloseTo(12);
    expect(row.outArea).toBeCloseTo(7.2);
  });

  it('uses original opening stock when no range is given', () => {
    const [row] = buildStockMovementRows({
      products: [product],
      purchases,
      invoices,
    });

    expect(row.openingStock).toBe(5);
    expect(row.closingStock).toBe(3);
  });

  it('marks products without movements as plain units', () => {
    const [row] = buildStockMovementRows({ products: [product] });

    expect(row).toMatchObject({
      openingStock: 6,
      closingStock: 6,
      hasArea: false,
      mixedUnit: false,
    });
  });
});

describe('buildStockCard', () => {
  it('lists movements in range with running balance', () => {
    const card = buildStockCard({
      product,
      purchases,
      invoices,
      partnerNames: { s1: 'NCC A', c1: 'Khách B' },
      ...range,
    });

    expect(card.product.openingStock).toBe(4);
    expect(card.entries).toHaveLength(2);
    expect(card.entries[0]).toMatchObject({
      type: 'in',
      code: 'PN1',
      partnerName: 'NCC A',
      qty: 1,
      length: 10,
      width: 1.2,
      balance: 5,
    });
    expect(card.entries[1]).toMatchObject({
      type: 'out',
      code: 'HD1',
      partnerName: 'Khách B',
      balance: 3,
    });
    expect(card.entries.at(-1).balance).toBe(card.product.closingStock);
  });
});
