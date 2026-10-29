import { describe, expect, it } from 'vitest';
import {
  buildPurchaseLine,
  getPurchaseLineTotal,
  normalizePurchaseItems,
} from '../purchasesDomain.js';

describe('purchasesDomain', () => {
  it('computes purchase line totals with dimensions', () => {
    expect(getPurchaseLineTotal({ qty: 2, unitCost: 100 })).toBe(200);
    expect(
      getPurchaseLineTotal({ qty: 2, unitCost: 100, length: 2, width: 3 })
    ).toBe(1200);
  });

  it('normalizes purchase items for payload persistence', () => {
    expect(
      normalizePurchaseItems([
        {
          qty: '2',
          unitCost: '100',
          length: '',
          width: 0,
          lineNote: null,
        },
      ])
    ).toEqual([
      {
        qty: 2,
        unitCost: 100,
        length: null,
        width: null,
        lineNote: '',
        lineTotal: 200,
      },
    ]);
  });
});

describe('buildPurchaseLine', () => {
  const product = { id: 'p1' };
  it('adds unit fields for a packaging unit', () => {
    expect(
      buildPurchaseLine({
        product,
        qty: 2,
        unitCost: 100,
        unit: { value: 'thùng', factor: 24 },
      })
    ).toMatchObject({ lineTotal: 200, unitName: 'thùng', factor: 24 });
  });
  it('adds no unit fields for the base unit', () => {
    const line = buildPurchaseLine({ product, qty: 1, unitCost: 5 });
    expect(line).not.toHaveProperty('unitName');
    expect(line).toMatchObject({ productId: 'p1', lineTotal: 5, length: null });
  });
});
