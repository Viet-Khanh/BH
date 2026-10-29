import { describe, expect, it } from 'vitest';
import { ean13 } from '../seed/ean13.js';

describe('ean13', () => {
  it('appends the check digit', () => {
    expect(ean13('400638133393')).toBe('4006381333931');
    expect(ean13('978030640615')).toBe('9780306406157');
  });

  it('always returns 13 digits', () => {
    expect(ean13('1')).toMatch(/^\d{13}$/);
    expect(ean13('893600001000')).toHaveLength(13);
  });
});
