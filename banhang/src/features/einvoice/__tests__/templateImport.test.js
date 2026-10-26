import { describe, expect, it } from 'vitest';
import { guessColumn } from '../domain/headerMatching.js';
import {
  addColumn,
  copyProfile,
  moveColumn,
  saveDraft,
  updateColumn,
  validateDraft,
} from '../domain/profileDraft.js';
import {
  buildProfileFromTemplate,
  detectHeaderRow,
} from '../domain/templateReader.js';
import viettel from '../profiles/viettel.js';

const fieldOf = (header) => guessColumn(header).field;

describe('guessColumn', () => {
  it.each([
    ['Tên hàng hóa/dịch vụ (*)', 'itemName'],
    ['TenHangHoa', 'itemName'],
    ['Số thứ tự hóa đơn (*)', 'invoiceSeq'],
    ['Số thứ tự', 'lineIndex'],
    ['Thuế GTGT (%) (*)', 'vatRate'],
    ['ThueSuatKhac', 'empty'],
    ['Tiền thuế GTGT', 'tax'],
    ['Thành tiền (*)', 'amountBeforeTax'],
    ['Loại hàng hoá đặc trưng', 'empty'],
    ['MaHD', 'appCode'],
    ['Cột lạ', 'empty'],
  ])('%s → %s', (header, field) => {
    expect(fieldOf(header)).toBe(field);
  });

  it('presets constants and formats', () => {
    expect(guessColumn('Loại tiền (*)')).toMatchObject({
      field: 'constant',
      constant: 'VND',
    });
    expect(guessColumn('Ngày hóa đơn')).toMatchObject({ format: 'dmy' });
    expect(guessColumn('Ký hiệu').prompt).toMatch('ký hiệu');
  });

  it('recognises most Viettel template headers', () => {
    const guessed = viettel.columns.map((column) => fieldOf(column.header));
    const matched = viettel.columns.filter(
      (column, index) => column.field !== 'empty' && guessed[index] !== 'empty'
    );
    expect(matched.length).toBeGreaterThanOrEqual(18);
  });
});

describe('buildProfileFromTemplate', () => {
  const rows = [
    ['TEMPLATE IMPORT HÓA ĐƠN'],
    [],
    ['Thông tin người mua', '', 'Thông tin hàng hóa'],
    [
      'STT',
      'Nhóm hóa đơn (*)',
      'Họ tên',
      'Tên hàng hóa/dịch vụ (*)',
      'Số lượng (*)',
    ],
    ['itemNo', 'group', 'buyerName', 'itemName', 'itemQuantity'],
  ];

  it('finds the header and the key row and keeps the preamble', () => {
    expect(detectHeaderRow(rows)).toBe(3);
    const profile = buildProfileFromTemplate({
      rows,
      sheetName: 'Thông tin hóa đơn',
    });
    expect(profile.preamble).toHaveLength(3);
    expect(profile.columns.map((column) => column.field)).toEqual([
      'lineIndex',
      'invoiceSeq',
      'buyerName',
      'itemName',
      'quantity',
    ]);
    expect(profile.columns[1].subHeader).toBe('group');
  });

  it('skips the key row when the next row is sample data', () => {
    const profile = buildProfileFromTemplate({
      rows: [
        ['MaHD', 'TenHangHoa', 'SoLuong'],
        ['1', 'Bia Hà Nội', 2],
      ],
      sheetName: 'Sheet1',
    });
    expect(profile.preamble).toEqual([]);
    expect(profile.columns[0].subHeader).toBeUndefined();
  });
});

describe('profile draft edits', () => {
  const columns = [
    { header: 'A', field: 'constant', constant: 'x' },
    { header: 'B', field: 'date', format: 'ymd' },
  ];

  it('moves, adds and changes fields without stale options', () => {
    expect(moveColumn(columns, 1, -1).map((c) => c.header)).toEqual(['B', 'A']);
    expect(moveColumn(columns, 1, 1)).toBe(columns);
    expect(addColumn(columns)).toHaveLength(3);
    expect(updateColumn(columns, 0, { field: 'itemName' })[0]).toEqual({
      header: 'A',
      field: 'itemName',
    });
    expect(
      updateColumn(columns, 1, { field: 'buyerName' })[1].format
    ).toBeUndefined();
  });

  it('copies, validates and saves', () => {
    const copy = copyProfile({
      id: 'generic',
      name: 'Chuẩn',
      columns,
      source: {},
    });
    expect(copy.id).toMatch(/^custom-/);
    expect(copy.source).toBeUndefined();
    expect(validateDraft({ ...copy, name: ' ' })).toMatch('tên');
    expect(validateDraft(copy)).toBeNull();
    const saved = saveDraft([], copy);
    expect(saveDraft(saved, { ...copy, name: 'Mới' })).toEqual([
      { ...copy, name: 'Mới' },
    ]);
  });
});
