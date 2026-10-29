import { describe, expect, it } from 'vitest';
import {
  countLabels,
  createProductRows,
  createPurchaseRows,
  getPrintableRows,
  getVisibleRows,
  setRowCount,
  setRowUnit,
} from '../labels/labelRows.js';

const beer = {
  id: 'p1',
  name: 'Bia Hà Nội',
  code: 'SP001',
  unit: 'lon',
  barcode: '8934588012228',
  sellPriceDefault: 10000,
  units: [{ name: 'thùng', factor: 24, sellPrice: 220000, barcode: '' }],
};

const noodle = {
  id: 'p2',
  name: 'Mì Hảo Hảo',
  code: 'SP002',
  unit: 'gói',
  sellPriceDefault: 5000,
  units: [{ name: 'thùng', factor: 30, sellPrice: null, barcode: 'T-30' }],
};

const items = [
  { productId: 'p1', qty: 2, unitName: 'thùng', factor: 24 },
  { productId: 'p2', qty: 7 },
];

describe('createPurchaseRows', () => {
  it('keeps every product, marks the ones with an own barcode as skippable', () => {
    const rows = createPurchaseRows(items, [beer, noodle]);
    expect(
      rows.map((row) => [row.productId, row.count, row.skippable])
    ).toEqual([
      ['p1', 48, true],
      ['p2', 7, false],
    ]);
    expect(rows[0].product).toBe(beer);
  });

  it('uses the extra products (saved purchase) over the screen list', () => {
    const renamed = { ...noodle, name: 'Mì mới' };
    const rows = createPurchaseRows(items, [beer, noodle], [renamed]);
    expect(rows[1].name).toBe('Mì mới');
  });

  it('ignores lines whose product is unknown', () => {
    expect(createPurchaseRows(items, [noodle])).toHaveLength(1);
  });
});

describe('createProductRows', () => {
  it('builds one base-unit row with count 1, never skippable', () => {
    const [row] = createProductRows(beer);
    expect(row).toMatchObject({ unitName: '', count: 1, skippable: false });
    expect(createProductRows(null)).toEqual([]);
  });
});

describe('setRowUnit', () => {
  it('rebuilds the row for the unit from the base count and keeps its key', () => {
    const rows = createPurchaseRows(items, [beer, noodle]);
    const key = rows[0].key;
    const next = setRowUnit(rows, key, 'thùng');
    expect(next[0]).toMatchObject({
      key,
      unitName: 'thùng',
      count: 2,
      baseCount: 48,
      price: 220000,
      barcode: '',
      skippable: true,
    });
    expect(next[0].warning).not.toBe('');
    expect(next[1]).toBe(rows[1]);
    const back = setRowUnit(next, key, '');
    expect(back[0]).toMatchObject({ unitName: '', count: 48 });
  });
});

describe('setRowCount', () => {
  it('stores whole non-negative counts', () => {
    const rows = createProductRows(noodle);
    const key = rows[0].key;
    expect(setRowCount(rows, key, 3.7)[0].count).toBe(3);
    expect(setRowCount(rows, key, -2)[0].count).toBe(0);
    expect(setRowCount(rows, key, null)[0].count).toBe(0);
  });
});

describe('visible and printable rows', () => {
  const rows = setRowCount(
    createPurchaseRows(items, [beer, noodle]),
    'p2::',
    0
  );

  it('hides skippable rows only when skipping', () => {
    expect(getVisibleRows(rows, true).map((row) => row.productId)).toEqual([
      'p2',
    ]);
    expect(getVisibleRows(rows, false)).toHaveLength(2);
  });

  it('prints only visible rows with a positive count', () => {
    expect(getPrintableRows(rows, true)).toEqual([]);
    expect(getPrintableRows(rows, false).map((row) => row.productId)).toEqual([
      'p1',
    ]);
    expect(countLabels(getPrintableRows(rows, false))).toBe(48);
  });
});
