import { describe, expect, it } from 'vitest';
import {
  guessResultMapping,
  parseAmount,
  parseDay,
  toResultRows,
} from '../domain/resultRows.js';

describe('result rows', () => {
  const header = [
    'Ký hiệu',
    'Số hóa đơn',
    'Ngày hóa đơn',
    'Mã của CQT',
    'Tổng tiền',
    'Số đơn hàng',
  ];

  it('guesses the provider list columns', () => {
    expect(guessResultMapping(header)).toEqual({
      number: 1,
      series: 0,
      taxAuthorityCode: 3,
      lookupCode: undefined,
      ref: 5,
      date: 2,
      total: 4,
    });
  });

  it('parses dates and amounts in provider formats', () => {
    expect(parseDay('6/11/2026 10:15')).toBe('2026-11-06');
    expect(parseDay('2026-11-06')).toBe('2026-11-06');
    expect(parseDay(46332)).toBe('2026-11-06');
    expect(parseAmount('1.250.000')).toBe(1250000);
    expect(parseAmount(70000.4)).toBe(70000);
    expect(parseAmount('')).toBeUndefined();
  });

  it('builds rows for the import, skipping empty lines', () => {
    const rows = [
      ['Danh sách hoá đơn'],
      header,
      ['1C26TAA', '0000101', '26/10/2026', 'M1-26-ABC', '70.000', 'INV-1'],
      ['', '', '', '', '', ''],
    ];
    expect(toResultRows(rows, 1, guessResultMapping(header))).toEqual([
      {
        rowNumber: 3,
        number: '0000101',
        series: '1C26TAA',
        taxAuthorityCode: 'M1-26-ABC',
        lookupCode: '',
        ref: 'INV-1',
        day: '2026-10-26',
        total: 70000,
      },
    ]);
  });
});
