import { describe, expect, it } from 'vitest';
import { applyProfile } from '../domain/applyProfile.js';
import { getProfile, PROFILES } from '../profiles/index.js';

const doc = (overrides = {}) => ({
  invoiceId: 'i1',
  code: 'INV-1',
  date: '2026-10-26T03:00:00.000Z',
  taxMethod: 'deduction',
  buyer: {
    name: '',
    companyName: 'Công ty An Phát',
    taxCode: '0312345678',
    address: 'Q.5',
    email: '',
  },
  paymentMethod: 'CK',
  discount: 5000,
  lines: [
    {
      index: 1,
      code: 'A',
      name: 'Bia',
      unit: 'lon',
      quantity: 2,
      unitPrice: 11000,
      amount: 22000,
      vatRate: '10',
      beforeTax: 20000,
      tax: 2000,
      note: '',
    },
    {
      index: 2,
      code: 'B',
      name: 'Gạo',
      unit: 'bao',
      quantity: 1,
      unitPrice: 108000,
      amount: 108000,
      vatRate: 'KCT',
      beforeTax: 108000,
      tax: 0,
      note: 'giao sau',
    },
  ],
  ...overrides,
});

describe('profile contract', () => {
  it.each(PROFILES)(
    '$id declares named columns with value functions',
    (profile) => {
      expect(profile.name).toEqual(expect.any(String));
      expect(profile.sheetName).toEqual(expect.any(String));
      profile.columns.forEach((column) => {
        expect(column.header).toEqual(expect.any(String));
        expect(typeof column.value).toBe('function');
        if (column.onlyFor)
          expect(['direct', 'deduction']).toContain(column.onlyFor);
      });
    }
  );

  it('has unique ids and falls back to generic', () => {
    const ids = PROFILES.map((profile) => profile.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(getProfile('nope').id).toBe('generic');
  });
});

describe('applyProfile (generic)', () => {
  const generic = getProfile('generic');

  it('writes one row per line and repeats invoice columns', () => {
    const { sheetName, rows } = applyProfile(generic, [doc()], {
      taxMethod: 'deduction',
    });
    const [header, first, second] = rows;
    expect(sheetName).toBe(generic.sheetName);
    expect(rows).toHaveLength(3);
    const col = (row, name) => row[header.indexOf(name)];
    expect(col(first, 'Mã HĐ (app)')).toBe('INV-1');
    expect(col(second, 'Mã HĐ (app)')).toBe('INV-1');
    expect(col(first, 'Ngày HĐ')).toBe('26/10/2026');
    expect(col(first, 'Thuế suất')).toBe('10%');
    expect(col(second, 'Thuế suất')).toBe('KCT');
    expect(col(first, 'Chiết khấu HĐ')).toBe(5000);
    expect(col(second, 'Chiết khấu HĐ')).toBe('');
  });

  it('omits tax columns for household businesses', () => {
    const { rows } = applyProfile(generic, [doc({ taxMethod: 'direct' })], {
      taxMethod: 'direct',
    });
    expect(rows[0]).not.toContain('Thuế suất');
    expect(rows[0]).not.toContain('Tiền thuế');
    expect(rows[0]).toContain('Thành tiền');
  });
});
