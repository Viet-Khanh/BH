import { describe, expect, it } from 'vitest';
import {
  MAX_PRODUCT_UNITS as BACKEND_MAX_PRODUCT_UNITS,
  getBaseQty as backendGetBaseQty,
} from '@backend/utils/productUnits.js';
import {
  MAX_PRODUCT_UNITS,
  findProductUnit,
  formatStockByUnits,
  formatStockLine,
  formatUnitsSummary,
  getBaseQty,
  getItemUnitName,
  getUnitCostPrice,
  getUnitOptions,
  getUnitSellPrice,
} from '../productUnits.js';

const product = {
  id: 'p1',
  unit: 'lon',
  stock: 51,
  sellPriceDefault: 10000,
  avgCost: 8000,
  units: [
    { name: 'lốc', factor: 6, sellPrice: null },
    { name: 'thùng', factor: 24, sellPrice: 220000 },
  ],
};

describe('productUnits (frontend)', () => {
  it('matches the backend base quantity', () => {
    [{ qty: 2 }, { qty: 2, factor: 24 }, { qty: 1, factor: 0 }, {}].forEach(
      (item) => expect(getBaseQty(item)).toBe(backendGetBaseQty(item))
    );
  });

  it('lists the base unit first, then packaging units', () => {
    expect(getUnitOptions(product)).toEqual([
      { value: '', label: 'lon', factor: 1 },
      { value: 'lốc', label: 'lốc (6 lon)', factor: 6 },
      { value: 'thùng', label: 'thùng (24 lon)', factor: 24 },
    ]);
    expect(getUnitOptions({ unit: 'cái' })).toEqual([
      { value: '', label: 'cái', factor: 1 },
    ]);
  });

  it('finds units by name', () => {
    expect(findProductUnit(product, 'thùng')).toEqual(product.units[1]);
    expect(findProductUnit(product, '')).toBeNull();
    expect(findProductUnit(product, 'két')).toBeNull();
  });

  it('prices units', () => {
    expect(getUnitSellPrice(product, '')).toBe(10000);
    expect(getUnitSellPrice(product, 'thùng')).toBe(220000);
    expect(getUnitSellPrice(product, 'lốc')).toBe(60000);
    expect(getUnitCostPrice(product, '')).toBe(8000);
    expect(getUnitCostPrice(product, 'thùng')).toBe(192000);
  });

  it('formats stock by units', () => {
    expect(formatStockByUnits(product)).toBe('2 thùng 3 lon');
    expect(formatStockByUnits({ ...product, stock: 6 })).toBe('1 lốc');
    expect(formatStockByUnits({ ...product, stock: 0 })).toBe('0 lon');
    expect(formatStockByUnits({ ...product, stock: -5 })).toBe('-5 lon');
    expect(formatStockByUnits({ unit: 'cái', stock: 3 })).toBe('3 cái');
  });

  it('summarizes units and names line units', () => {
    expect(formatUnitsSummary(product)).toBe('lon (lốc 6, thùng 24)');
    expect(formatUnitsSummary({ unit: 'cái' })).toBe('cái');
    expect(getItemUnitName({ unitName: 'thùng' }, product)).toBe('thùng');
    expect(getItemUnitName({}, product)).toBe('lon');
    expect(getItemUnitName({}, null)).toBe('');
  });

  it('shares the unit limit with the backend', () => {
    expect(MAX_PRODUCT_UNITS).toBe(BACKEND_MAX_PRODUCT_UNITS);
  });

  it('formats the stock line: number only without units', () => {
    expect(formatStockLine({ unit: 'm2', stock: 12 })).toBe('Tồn kho: 12');
    expect(formatStockLine({ unit: 'm2', openingStock: 4 })).toBe('Tồn kho: 4');
    expect(formatStockLine(null)).toBe('Tồn kho: 0');
    expect(formatStockLine({ unit: 'cái', stock: 3, units: [] })).toBe(
      'Tồn kho: 3'
    );
  });

  it('formats the stock line with the units breakdown', () => {
    expect(formatStockLine(product)).toBe('Tồn kho: 51 lon (2 thùng 3 lon)');
    expect(formatStockLine({ ...product, stock: 3 })).toBe('Tồn kho: 3 lon');
    expect(formatStockLine({ ...product, stock: 0 })).toBe('Tồn kho: 0 lon');
  });
});
