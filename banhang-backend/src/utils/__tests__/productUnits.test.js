import { describe, expect, it } from 'vitest';
import {
  getBaseQty,
  getItemFactor,
  normalizeProductUnits,
  resolveLineUnit,
} from '../productUnits.js';

const product = {
  id: 'p1',
  name: 'Coca lon',
  unit: 'lon',
  units: [
    { name: 'lốc', factor: 6, sellPrice: 58000 },
    { name: 'thùng', factor: 24, sellPrice: 220000 },
  ],
};

describe('getItemFactor / getBaseQty', () => {
  it('treats a missing or invalid factor as 1', () => {
    expect(getItemFactor({})).toBe(1);
    expect(getItemFactor({ factor: 0 })).toBe(1);
    expect(getItemFactor({ factor: 'x' })).toBe(1);
    expect(getItemFactor({ factor: 24 })).toBe(24);
    expect(getBaseQty({ qty: 2 })).toBe(2);
    expect(getBaseQty({ qty: 2, factor: 24 })).toBe(48);
    expect(getBaseQty({ qty: '3', factor: '6' })).toBe(18);
    expect(getBaseQty({})).toBe(0);
  });
});

describe('normalizeProductUnits', () => {
  it('trims, coerces numbers and drops empty rows', () => {
    expect(
      normalizeProductUnits(
        [
          { name: ' thùng ', factor: '24', sellPrice: '220000' },
          { name: '', factor: null },
          null,
          { name: 'lốc', factor: 6, sellPrice: null },
        ],
        'lon'
      )
    ).toEqual({
      units: [
        { name: 'thùng', factor: 24, sellPrice: 220000 },
        { name: 'lốc', factor: 6, sellPrice: null },
      ],
      error: null,
    });
  });

  it('rejects a row with a factor or price but no name', () => {
    expect(
      normalizeProductUnits([{ name: ' ', factor: 24 }], 'lon').error
    ).toBe('Đơn vị quy đổi thiếu tên.');
    expect(
      normalizeProductUnits([{ name: '', sellPrice: 1000 }], 'lon').error
    ).toBe('Đơn vị quy đổi thiếu tên.');
    expect(
      normalizeProductUnits([{ name: '', factor: '', sellPrice: '' }], 'lon')
    ).toEqual({ units: [], error: null });
  });

  it('returns [] for a missing list', () => {
    expect(normalizeProductUnits(undefined, 'lon')).toEqual({
      units: [],
      error: null,
    });
  });

  it('rejects invalid units', () => {
    expect(
      normalizeProductUnits([{ name: 'lon', factor: 6 }], 'lon').error
    ).toBe('Đơn vị quy đổi "lon" trùng đơn vị cơ bản.');
    expect(
      normalizeProductUnits(
        [
          { name: 'Thùng', factor: 24 },
          { name: 'thùng', factor: 20 },
        ],
        'lon'
      ).error
    ).toBe('Đơn vị quy đổi "thùng" bị trùng.');
    expect(
      normalizeProductUnits([{ name: 'thùng', factor: 1 }], 'lon').error
    ).toBe('Hệ số quy đổi của "thùng" phải lớn hơn 1.');
    expect(
      normalizeProductUnits(
        [{ name: 'thùng', factor: 24, sellPrice: -1 }],
        'lon'
      ).error
    ).toBe('Giá bán của "thùng" phải >= 0.');
    const six = Array.from({ length: 6 }, (_, i) => ({
      name: `u${i}`,
      factor: i + 2,
    }));
    expect(normalizeProductUnits(six, 'lon').error).toBe(
      'Tối đa 5 đơn vị quy đổi.'
    );
  });
});

describe('resolveLineUnit', () => {
  it('leaves base-unit lines without unit fields', () => {
    expect(resolveLineUnit({ productId: 'p1', qty: 2 }, product)).toEqual({
      productId: 'p1',
      qty: 2,
    });
    expect(
      resolveLineUnit(
        { productId: 'p1', qty: 2, unitName: 'lon', factor: 1 },
        product
      )
    ).toEqual({ productId: 'p1', qty: 2 });
  });

  it('keeps a snapshot factor and fills a missing one from the product', () => {
    expect(
      resolveLineUnit(
        { productId: 'p1', qty: 1, unitName: 'thùng', factor: 20 },
        product
      )
    ).toEqual({ productId: 'p1', qty: 1, unitName: 'thùng', factor: 20 });
    expect(
      resolveLineUnit({ productId: 'p1', qty: 1, unitName: 'thùng' }, product)
    ).toEqual({ productId: 'p1', qty: 1, unitName: 'thùng', factor: 24 });
  });

  it('rejects an unknown unit with HTTP status 400', () => {
    expect(() =>
      resolveLineUnit({ productId: 'p1', qty: 1, unitName: 'két' }, product)
    ).toThrow('Đơn vị "két" không có trong hàng Coca lon.');
    try {
      resolveLineUnit({ productId: 'p1', qty: 1, unitName: 'két' }, product);
    } catch (error) {
      expect(error.status).toBe(400);
    }
  });

  it('keeps a snapshot factor when the base unit was renamed to the line unit', () => {
    const renamed = { ...product, unit: 'lốc', units: [] };
    expect(
      resolveLineUnit(
        { productId: 'p1', qty: 1, unitName: 'lốc', factor: 6 },
        renamed
      )
    ).toEqual({ productId: 'p1', qty: 1, unitName: 'lốc', factor: 6 });
    expect(
      resolveLineUnit({ productId: 'p1', qty: 1, unitName: 'lốc' }, renamed)
    ).toEqual({ productId: 'p1', qty: 1 });
  });

  it('strips unit fields from lines without a unit name', () => {
    expect(
      resolveLineUnit(
        { productId: 'p1', qty: 1, unitName: ' ', factor: 24 },
        product
      )
    ).toEqual({ productId: 'p1', qty: 1 });
  });

  it('keeps only a valid snapshot when the product is unknown', () => {
    expect(
      resolveLineUnit(
        { productId: 'x', qty: 1, unitName: 'thùng', factor: 24 },
        null
      )
    ).toEqual({ productId: 'x', qty: 1, unitName: 'thùng', factor: 24 });
    expect(
      resolveLineUnit({ productId: 'x', qty: 1, unitName: 'thùng' }, null)
    ).toEqual({ productId: 'x', qty: 1 });
    expect(
      resolveLineUnit(
        { productId: 'x', qty: 1, unitName: 'thùng', factor: 0 },
        null
      )
    ).toEqual({ productId: 'x', qty: 1 });
    expect(
      resolveLineUnit(
        { productId: 'x', qty: 1, unitName: '', factor: 24 },
        undefined
      )
    ).toEqual({ productId: 'x', qty: 1 });
  });
});

describe('normalizeProductUnits barcodes', () => {
  it('trims unit barcodes and drops empty ones', () => {
    expect(
      normalizeProductUnits(
        [
          { name: 'thùng', factor: 24, barcode: ' 8934588012345 ' },
          { name: 'lốc', factor: 6, barcode: '' },
        ],
        'lon'
      ).units
    ).toEqual([
      { name: 'thùng', factor: 24, sellPrice: null, barcode: '8934588012345' },
      { name: 'lốc', factor: 6, sellPrice: null },
    ]);
  });

  it('rejects a unit row with only a barcode', () => {
    expect(normalizeProductUnits([{ barcode: '123456' }], 'lon').error).toBe(
      'Đơn vị quy đổi thiếu tên.'
    );
  });
});
