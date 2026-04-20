import { describe, expect, it } from 'vitest';
import * as XLSX from 'xlsx';
import {
  canCommitOpeningImport,
  parseOpeningImportWorkbook,
} from '../openingImportUtils.js';

const createWorkbook = (rows) => {
  const workbook = XLSX.utils.book_new();
  const worksheet = XLSX.utils.aoa_to_sheet(rows);
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');
  return workbook;
};

describe('openingImportUtils', () => {
  it('parses customer workbook with Vietnamese headers', () => {
    const workbook = createWorkbook([
      ['Tên khách hàng', 'Số điện thoại', 'Địa chỉ', 'Công nợ đầu kỳ'],
      ['Khách A', '0909', 'HCM', '1.250,5'],
    ]);

    expect(parseOpeningImportWorkbook(workbook, 'customers')).toEqual([
      {
        rowNumber: 2,
        name: 'Khách A',
        phone: '0909',
        address: 'HCM',
        openingBalance: '1.250,5',
      },
    ]);
  });

  it('parses supplier workbook with alias headers without accents', () => {
    const workbook = createWorkbook([
      ['ten ncc', 'sdt', 'dia chi', 'cong no'],
      ['NCC A', '0909', 'HN', -500],
    ]);

    expect(parseOpeningImportWorkbook(workbook, 'suppliers')).toEqual([
      {
        rowNumber: 2,
        name: 'NCC A',
        phone: '0909',
        address: 'HN',
        openingBalance: -500,
      },
    ]);
  });

  it('only allows commit when preview has no errors and has normalized rows', () => {
    expect(
      canCommitOpeningImport({
        normalizedRows: [{ rowNumber: 2 }],
        errors: [],
      })
    ).toBe(true);

    expect(
      canCommitOpeningImport({
        normalizedRows: [{ rowNumber: 2 }],
        errors: [{ code: 'INVALID' }],
      })
    ).toBe(false);

    expect(
      canCommitOpeningImport({
        normalizedRows: [],
        errors: [],
      })
    ).toBe(false);
  });
});
