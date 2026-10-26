import { describe, expect, it } from 'vitest';
import {
  applyProfile,
  documentProblems,
  profileProblems,
} from '../domain/applyProfile.js';
import { getField } from '../domain/fields/index.js';
import {
  allProfiles,
  BUILT_IN_PROFILES,
  getProfile,
  listProfiles,
} from '../profiles/index.js';

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
  it.each(BUILT_IN_PROFILES)('$id is a valid data profile', (profile) => {
    expect(profile.name).toEqual(expect.any(String));
    expect(['issue', 'adjust']).toContain(profile.purpose);
    profile.columns.forEach((column) => {
      expect(column.header).toEqual(expect.any(String));
      expect(getField(column.field), column.header).not.toBeNull();
      if (column.format)
        expect(getField(column.field).formats).toHaveProperty(column.format);
      if (column.onlyFor)
        expect(['direct', 'deduction']).toContain(column.onlyFor);
    });
  });

  it('has unique ids and falls back per purpose', () => {
    const ids = allProfiles().map((profile) => profile.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(getProfile('nope').id).toBe('generic');
    expect(getProfile('nope', {}, 'adjust').id).toBe('generic-adjust');
  });

  it('includes custom profiles from settings', () => {
    const settings = {
      einvoiceCustomProfiles: [
        { id: 'c1', name: 'Của tôi', purpose: 'issue', columns: [] },
      ],
    };
    expect(getProfile('c1', settings).name).toBe('Của tôi');
    expect(listProfiles(settings, 'adjust').map((p) => p.id)).not.toContain(
      'c1'
    );
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

describe('applyProfile (data features)', () => {
  const profile = {
    id: 't',
    name: 'Thử',
    purpose: 'issue',
    preamble: [['Tiêu đề'], []],
    columns: [
      { header: 'Nhóm', subHeader: 'group', field: 'invoiceSeq' },
      { header: 'Ký hiệu', field: 'constant', constant: '1C26TAA' },
      { header: 'MST', field: 'buyerTaxCode', firstLineOnly: true },
      { header: 'TS', field: 'vatRate', format: 'viettel' },
      { header: 'HTTT', field: 'paymentMethod', format: 'text' },
      { header: 'Ngày', field: 'date', format: 'ymd' },
      { header: 'Trống', field: 'empty' },
    ],
  };

  it('writes preamble, sub-header, constants, formats and first-line fields', () => {
    const { rows } = applyProfile(profile, [doc(), doc({ code: 'INV-2' })], {
      taxMethod: 'deduction',
    });
    expect(rows.slice(0, 4)).toEqual([
      ['Tiêu đề'],
      [],
      ['Nhóm', 'Ký hiệu', 'MST', 'TS', 'HTTT', 'Ngày', 'Trống'],
      ['group', '', '', '', '', '', ''],
    ]);
    expect(rows[4]).toEqual([
      1,
      '1C26TAA',
      '0312345678',
      10,
      'Chuyển khoản',
      '2026-10-26',
      '',
    ]);
    expect(rows[5].slice(0, 4)).toEqual([1, '1C26TAA', '', -2]);
    expect(rows[6][0]).toBe(2);
  });

  it('reports columns the shop must fill and single-rate limits', () => {
    const misa = getProfile('misa');
    expect(profileProblems(misa)[0]).toMatch('Mã đơn vị lập hóa đơn');
    expect(documentProblems(misa, doc())[0]).toMatch('một thuế suất');
    expect(
      profileProblems({
        ...misa,
        columns: misa.columns.map((column) => ({ ...column, constant: 'X' })),
      })
    ).toEqual([]);
  });
});
