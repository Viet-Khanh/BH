import { expect, it } from 'vitest';
import {
  getAreaMultiplier,
  getLineAmount,
  getMeasuredQty,
  hasDimensions,
  normalizeDimension,
  readDimensions,
} from '../lineMeasure.js';

it('normalizes dimensions to positive numbers or null', () => {
  expect(normalizeDimension('2.5')).toBe(2.5);
  expect(normalizeDimension(0)).toBeNull();
  expect(normalizeDimension(-1)).toBeNull();
  expect(normalizeDimension(undefined)).toBeNull();
});

it('treats items without both dimensions as plain quantity', () => {
  expect(hasDimensions({ length: 2 })).toBe(false);
  expect(getAreaMultiplier({ length: 2 })).toBe(1);
  expect(getMeasuredQty({ qty: 3 })).toBe(3);
  expect(getLineAmount({ qty: 3, unitPrice: 1000 })).toBe(3000);
});

it('multiplies by area when both dimensions are set', () => {
  const item = {
    qty: 2,
    length: 1.5,
    width: 2,
    unitPrice: 1000,
    unitCost: 800,
  };
  expect(hasDimensions(item)).toBe(true);
  expect(getMeasuredQty(item)).toBe(6);
  expect(getLineAmount(item)).toBe(6000);
  expect(getLineAmount(item, 'unitCost')).toBe(4800);
});

it('requires both dimensions or neither', () => {
  expect(readDimensions(2, null).error).toMatch('chiều dài và chiều rộng');
  expect(readDimensions(2, 3)).toEqual({ length: 2, width: 3, error: null });
  expect(readDimensions(null, 0)).toEqual({
    length: null,
    width: null,
    error: null,
  });
});
