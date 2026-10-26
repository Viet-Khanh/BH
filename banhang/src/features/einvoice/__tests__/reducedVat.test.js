import { describe, expect, it } from 'vitest';
import { shouldWarnReducedVat } from '../domain/reducedVat.js';

const deduction = { taxMethod: 'deduction', defaultVatRate: '8' };

describe('shouldWarnReducedVat', () => {
  it('warns only after 31/12/2026 in Vietnam time', () => {
    expect(
      shouldWarnReducedVat(deduction, new Date('2026-12-31T16:00:00Z'))
    ).toBe(false);
    expect(
      shouldWarnReducedVat(deduction, new Date('2026-12-31T17:00:00Z'))
    ).toBe(true);
  });

  it('ignores household businesses and other default rates', () => {
    const later = new Date('2027-02-01T00:00:00Z');
    expect(shouldWarnReducedVat({ taxMethod: 'direct' }, later)).toBe(false);
    expect(
      shouldWarnReducedVat({ ...deduction, defaultVatRate: '10' }, later)
    ).toBe(false);
  });
});
