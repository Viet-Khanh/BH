import { describe, expect, it } from 'vitest';
import {
  buildLabelJobs,
  buildLabelRow,
  isValidEan13,
} from '../labels/buildLabelJobs.js';

const beer = {
  id: 'p1',
  name: 'Bia Hà Nội',
  code: 'SP001',
  unit: 'lon',
  barcode: '8934588012228',
  sellPriceDefault: 10000,
  units: [
    { name: 'thùng', factor: 24, sellPrice: 220000, barcode: '' },
    { name: 'lốc', factor: 6, sellPrice: null, barcode: 'LOC-001' },
  ],
};

const noodle = {
  id: 'p2',
  name: 'Mì Hảo Hảo',
  code: 'SP002',
  unit: 'gói',
  sellPriceDefault: 5000,
};

const products = [beer, noodle];

describe('isValidEan13', () => {
  it('checks the check digit', () => {
    expect(isValidEan13('8934588012228')).toBe(true);
    expect(isValidEan13('8934588012229')).toBe(false);
    expect(isValidEan13('893458801222')).toBe(false);
    expect(isValidEan13('SP001')).toBe(false);
  });
});

describe('buildLabelJobs', () => {
  it('groups lines of one product into one base-unit row', () => {
    const items = [
      { productId: 'p1', unitName: 'thùng', factor: 24, qty: 2 },
      { productId: 'p1', qty: 3 },
    ];
    const rows = buildLabelJobs({ items, products, skipWithBarcode: false });
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      productId: 'p1',
      name: 'Bia Hà Nội',
      unitName: '',
      unitLabel: 'lon',
      count: 51,
      baseCount: 51,
      price: 10000,
      barcode: '8934588012228',
      barcodeFormat: 'EAN13',
      warning: '',
      hasOwnBarcode: true,
    });
  });

  it('uses the product code with CODE128 when there is no barcode', () => {
    const rows = buildLabelJobs({
      items: [{ productId: 'p2', qty: 4 }],
      products,
    });
    expect(rows[0]).toMatchObject({
      barcode: 'SP002',
      barcodeFormat: 'CODE128',
      hasOwnBarcode: false,
      count: 4,
    });
  });

  it('skips rows that already have a barcode by default', () => {
    const items = [
      { productId: 'p1', qty: 1 },
      { productId: 'p2', qty: 1 },
    ];
    expect(
      buildLabelJobs({ items, products }).map((row) => row.productId)
    ).toEqual(['p2']);
    expect(
      buildLabelJobs({ items, products, skipWithBarcode: false })
    ).toHaveLength(2);
  });

  it('ignores lines of unknown products and keeps line order', () => {
    const items = [
      { productId: 'p2', qty: 1 },
      { productId: 'missing', qty: 2 },
      { productId: 'p1', qty: 1 },
    ];
    const rows = buildLabelJobs({ items, products, skipWithBarcode: false });
    expect(rows.map((row) => row.productId)).toEqual(['p2', 'p1']);
  });
});

describe('buildLabelRow', () => {
  it('warns when a packaging unit has no barcode', () => {
    const row = buildLabelRow(beer, 'thùng', 2);
    expect(row).toMatchObject({
      unitName: 'thùng',
      unitLabel: 'thùng',
      price: 220000,
      barcode: '',
      hasOwnBarcode: false,
      count: 2,
    });
    expect(row.warning).toBe('Đơn vị chưa có mã vạch — tem không có mã vạch.');
  });

  it("uses the unit's own barcode", () => {
    const row = buildLabelRow(beer, 'lốc', 1);
    expect(row).toMatchObject({
      barcode: 'LOC-001',
      barcodeFormat: 'CODE128',
      hasOwnBarcode: true,
      warning: '',
      price: 60000,
    });
  });

  it('converts the base count when switching units', () => {
    const row = buildLabelRow(beer, 'thùng', undefined, 51);
    expect(row.count).toBe(3);
    expect(row.baseCount).toBe(51);
    expect(buildLabelRow(beer, '', undefined, 51).count).toBe(51);
  });

  it('builds a stable key per product and unit', () => {
    expect(buildLabelRow(beer, 'thùng', 1).key).toBe('p1::thùng');
    expect(buildLabelRow(noodle, '', 1).key).toBe('p2::');
  });
});
