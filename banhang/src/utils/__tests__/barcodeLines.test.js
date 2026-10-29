import { describe, expect, it } from 'vitest';
import {
  findBarcodeMatch,
  mergeScannedLine,
  nextUnitName,
  switchLineUnit,
} from '../barcodeLines.js';

const coca = {
  id: 'p1',
  code: 'COCA',
  unit: 'lon',
  barcode: '111',
  units: [
    { name: 'lốc', factor: 6, barcode: '222' },
    { name: 'thùng', factor: 24, barcode: '333' },
  ],
};
const pepsi = { id: 'p2', code: '333', unit: 'lon' };

describe('findBarcodeMatch', () => {
  it('prefers barcodes, then product code', () => {
    expect(findBarcodeMatch([pepsi, coca], ' 333 ')).toEqual({
      product: coca,
      unitName: 'thùng',
    });
    expect(findBarcodeMatch([coca], '111')).toEqual({
      product: coca,
      unitName: '',
    });
    expect(findBarcodeMatch([coca], 'COCA')).toEqual({
      product: coca,
      unitName: '',
    });
    expect(findBarcodeMatch([coca], '999')).toBeNull();
    expect(findBarcodeMatch([coca], '')).toBeNull();
  });
});

describe('mergeScannedLine', () => {
  const line = { productId: 'p1', qty: 1, unitPrice: 10000, lineTotal: 10000 };
  it('adds 1 to the same product and unit', () => {
    const items = mergeScannedLine([line], { ...line }, 'unitPrice');
    expect(items).toEqual([{ ...line, qty: 2, lineTotal: 20000 }]);
  });
  it('appends a line for another unit or a line with dimensions', () => {
    const carton = {
      ...line,
      unitName: 'thùng',
      factor: 24,
      unitPrice: 220000,
      lineTotal: 220000,
    };
    expect(mergeScannedLine([line], carton, 'unitPrice')).toHaveLength(2);
    const measured = { ...line, length: 2, width: 1 };
    expect(mergeScannedLine([measured], { ...line }, 'unitPrice')).toHaveLength(
      2
    );
  });
  it('works with unitCost', () => {
    const buy = { productId: 'p1', qty: 1, unitCost: 7000, lineTotal: 7000 };
    expect(mergeScannedLine([buy], { ...buy }, 'unitCost')[0]).toMatchObject({
      qty: 2,
      lineTotal: 14000,
    });
  });
});

describe('switchLineUnit / nextUnitName', () => {
  it('changes unit fields and price, keeps qty', () => {
    const item = {
      productId: 'p1',
      qty: 2,
      unitPrice: 10000,
      lineTotal: 20000,
    };
    expect(switchLineUnit(item, coca, 'thùng', 220000, 'unitPrice')).toEqual({
      productId: 'p1',
      qty: 2,
      unitPrice: 220000,
      lineTotal: 440000,
      unitName: 'thùng',
      factor: 24,
    });
    const back = switchLineUnit(
      { ...item, unitName: 'thùng', factor: 24 },
      coca,
      '',
      10000,
      'unitPrice'
    );
    expect(back).not.toHaveProperty('unitName');
    expect(back).not.toHaveProperty('factor');
  });
  it('cycles units', () => {
    expect(nextUnitName(coca, '')).toBe('lốc');
    expect(nextUnitName(coca, 'lốc')).toBe('thùng');
    expect(nextUnitName(coca, 'thùng')).toBe('');
    expect(nextUnitName({ unit: 'cái' }, '')).toBe('');
  });
});
