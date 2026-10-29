import { describe, expect, it, vi } from 'vitest';

vi.mock('../../repositories/sales.repository.js', () => ({}));

const { buildProductSearchFilter } = await import('../sales.service.js');

describe('buildProductSearchFilter', () => {
  it('matches product and unit barcodes', () => {
    const filter = buildProductSearchFilter('8934588012345');
    const fields = filter.$and[0].$or.map((clause) => Object.keys(clause)[0]);
    expect(fields).toEqual(
      expect.arrayContaining(['name', 'code', 'barcode', 'units.barcode'])
    );
  });
});
