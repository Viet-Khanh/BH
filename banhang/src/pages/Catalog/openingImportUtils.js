import * as XLSX from 'xlsx';
import { normalizeHeader } from './catalogUtils.js';

export const OPENING_IMPORT_CONFIGS = {
  customers: {
    label: 'khách hàng',
    headers: [
      'Tên khách hàng',
      'Số điện thoại',
      'Địa chỉ',
      'Công nợ đầu kỳ',
    ],
    fileName: 'mau-khach-hang-cong-no-dau-ky',
    sheetName: 'KhachHangDauKy',
    columnMap: {
      tenkhachhang: 'name',
      tenkh: 'name',
      ten: 'name',
      khachhang: 'name',
      sodienthoai: 'phone',
      sdt: 'phone',
      dienthoai: 'phone',
      phone: 'phone',
      diachi: 'address',
      address: 'address',
      congnodauky: 'openingBalance',
      congno: 'openingBalance',
      sodudauky: 'openingBalance',
      openingbalance: 'openingBalance',
    },
  },
  suppliers: {
    label: 'nhà cung cấp',
    headers: [
      'Tên nhà cung cấp',
      'Số điện thoại',
      'Địa chỉ',
      'Công nợ đầu kỳ',
    ],
    fileName: 'mau-nha-cung-cap-cong-no-dau-ky',
    sheetName: 'NhaCungCapDauKy',
    columnMap: {
      tennhacungcap: 'name',
      tenncc: 'name',
      ten: 'name',
      nhacungcap: 'name',
      ncc: 'name',
      sodienthoai: 'phone',
      sdt: 'phone',
      dienthoai: 'phone',
      phone: 'phone',
      diachi: 'address',
      address: 'address',
      congnodauky: 'openingBalance',
      congno: 'openingBalance',
      sodudauky: 'openingBalance',
      openingbalance: 'openingBalance',
    },
  },
};

export const getOpeningImportConfig = (target) => {
  const config = OPENING_IMPORT_CONFIGS[target];
  if (!config) {
    throw new Error('Target import đầu kỳ không hợp lệ.');
  }
  return config;
};

export const buildOpeningImportTemplateWorkbook = (target) => {
  const config = getOpeningImportConfig(target);
  const worksheet = XLSX.utils.aoa_to_sheet([
    config.headers,
    config.headers.map(() => ''),
  ]);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, config.sheetName);
  return {
    workbook,
    fileName: config.fileName,
  };
};

export const parseOpeningImportWorkbook = (workbook, target) => {
  const config = getOpeningImportConfig(target);
  const sheetName = workbook.SheetNames[0];
  if (!sheetName) {
    throw new Error('File không có sheet dữ liệu.');
  }

  const worksheet = workbook.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });
  if (!rows.length) return [];

  const [headerRow = [], ...dataRows] = rows;
  const normalizedHeaders = headerRow.map((cell) => normalizeHeader(cell));

  return dataRows
    .filter((row) => row.some((cell) => String(cell ?? '').trim() !== ''))
    .map((row, index) => {
      const mappedRow = { rowNumber: index + 2 };
      normalizedHeaders.forEach((headerKey, cellIndex) => {
        const field = config.columnMap[headerKey];
        if (!field) return;
        const value = row[cellIndex];
        mappedRow[field] =
          typeof value === 'string' ? value.trim() : value ?? '';
      });
      return mappedRow;
    });
};

export const canCommitOpeningImport = (previewResult) =>
  Boolean(
    previewResult &&
      Array.isArray(previewResult.normalizedRows) &&
      previewResult.normalizedRows.length &&
      !previewResult.errors?.length
  );

export const getOpeningImportTargetLabel = (target) =>
  getOpeningImportConfig(target).label;
