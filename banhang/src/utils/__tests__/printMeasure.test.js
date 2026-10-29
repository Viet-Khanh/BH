import { describe, expect, it } from 'vitest';
import { chooseAutoPageSize } from '../printMeasure.js';

const limitPx = (188 * 96) / 25.4;

describe('chooseAutoPageSize', () => {
  it('picks A5 up to the limit and A4 above it', () => {
    expect(chooseAutoPageSize(0)).toBe('A5');
    expect(chooseAutoPageSize(limitPx)).toBe('A5');
    expect(chooseAutoPageSize(limitPx + 0.5)).toBe('A4');
  });

  it('falls back to A4 when the height is not finite', () => {
    expect(chooseAutoPageSize(Number.POSITIVE_INFINITY)).toBe('A4');
    expect(chooseAutoPageSize(Number.NaN)).toBe('A4');
  });
});
