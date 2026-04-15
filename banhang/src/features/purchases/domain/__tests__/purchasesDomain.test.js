import { describe, expect, it } from 'vitest';
import {
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
