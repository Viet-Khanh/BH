import { describe, expect, it } from 'vitest';
import { buildEditFormValues } from '../catalogFormValues.js';

describe('buildEditFormValues', () => {
  it('gives products without units an empty units list', () => {
    expect(buildEditFormValues({ id: 'b', name: 'B' }, 'products')).toEqual({
      id: 'b',
      name: 'B',
      units: [],
    });
  });

  it('keeps the units of products that have them', () => {
    const units = [{ name: 'thùng', factor: 24 }];
    expect(buildEditFormValues({ id: 'a', units }, 'products').units).toBe(
      units
    );
  });

  it('leaves other catalog records untouched', () => {
    ['customers', 'suppliers', 'units'].forEach((key) =>
      expect(buildEditFormValues({ id: 'c', name: 'C' }, key)).toEqual({
        id: 'c',
        name: 'C',
      })
    );
  });
});
