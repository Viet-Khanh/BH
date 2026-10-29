import { describe, expect, it, vi } from 'vitest';
import {
  buildSaleLine,
  createConfirmAddHandler,
} from '../invoiceItemHandlers.js';

const run = (pendingUnit) => {
  let items = [];
  const confirm = createConfirmAddHandler({
    pendingProduct: { id: 'p1', avgCost: 8000 },
    pendingQty: 2,
    pendingPrice: 220000,
    pendingLength: null,
    pendingWidth: null,
    pendingUnit,
    setItems: (update) => {
      items = update(items);
    },
    setSearchOpen: vi.fn(),
    setPendingQty: vi.fn(),
    setPendingLength: vi.fn(),
    setPendingWidth: vi.fn(),
  });
  confirm();
  return items[0];
};

describe('createConfirmAddHandler', () => {
  it('adds the unit snapshot for a packaging unit', () => {
    expect(run({ value: 'thùng', factor: 24 })).toMatchObject({
      productId: 'p1',
      qty: 2,
      unitPrice: 220000,
      lineTotal: 440000,
      unitName: 'thùng',
      factor: 24,
      costPriceSnapshot: 8000,
    });
  });

  it('adds no unit fields for the base unit', () => {
    const line = run({ value: '', factor: 1 });
    expect(line).not.toHaveProperty('unitName');
    expect(line).not.toHaveProperty('factor');
    expect(run(undefined)).not.toHaveProperty('unitName');
  });
});

describe('buildSaleLine', () => {
  it('builds a carton line with the unit snapshot', () => {
    expect(
      buildSaleLine({
        product: { id: 'p1', avgCost: 8000 },
        qty: 2,
        unitPrice: 220000,
        unit: { value: 'thùng', factor: 24 },
      })
    ).toMatchObject({
      productId: 'p1',
      lineTotal: 440000,
      unitName: 'thùng',
      factor: 24,
      length: null,
      width: null,
    });
  });
});
