import { v4 as uuid } from 'uuid';
import { formatMoney } from '../../utils/moneyFormat.js';

export const normalizeSearchText = (value) =>
  String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();

export const buildSearchText = (record) =>
  Object.values(record ?? {})
    .filter((value) => value !== null && value !== undefined)
    .join(' ');

export const hasSearchMatch = (record, keyword) => {
  const normalizedKeyword = normalizeSearchText(keyword);
  if (!normalizedKeyword) return true;
  const haystack = normalizeSearchText(buildSearchText(record));
  return normalizedKeyword.split(' ').every((term) => haystack.includes(term));
};

export const normalizeHeader = (value) =>
  normalizeSearchText(value).replace(/\s+/g, '');

export const buildCodeFromName = (name = '') => {
  const cleaned = name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
  if (!cleaned) return '';
  return cleaned
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word[0]?.toUpperCase())
    .join('');
};

export const parseNumberInput = (value) => {
  if (!value) return '';
  return String(value).replace(/\./g, '').replace(/,/g, '');
};

export const formatNumberInput = (value) => {
  if (value === null || value === undefined || value === '') return '';
  const numeric = typeof value === 'number' ? value : Number(parseNumberInput(value));
  if (Number.isNaN(numeric)) return '';
  return formatMoney(numeric);
};

export const parseImportNumber = (value) => {
  const cleaned = parseNumberInput(value);
  const numeric = Number(cleaned || 0);
  return Number.isNaN(numeric) ? 0 : numeric;
};

export const buildTemplateRow = (headers) =>
  headers.reduce((acc, header) => {
    acc[header] = '';
    return acc;
  }, {});

export const TEMPLATE_CONFIGS = {
  products: {
    headers: ['Ma_hang', 'Ten_hang', 'DVT', 'Don_gia_le', 'Don_gia_si', 'Gia_von', 'Ton_dau'],
    fileName: 'mau-danh-muc-san-pham',
    sheetName: 'SanPham',
  },
  customers: {
    headers: ['Ten', 'So_dien_thoai', 'Dia_chi'],
    fileName: 'mau-danh-muc-khach-hang',
    sheetName: 'KhachHang',
  },
  suppliers: {
    headers: ['Ten', 'So_dien_thoai', 'Dia_chi'],
    fileName: 'mau-danh-muc-nha-cung-cap',
    sheetName: 'NhaCungCap',
  },
  units: {
    headers: ['DVT'],
    fileName: 'mau-danh-muc-don-vi',
    sheetName: 'DonVi',
  },
};

export const IMPORT_CONFIGS = {
  products: {
    columnMap: {
      stt: null,
      mahang: 'code',
      tenhang: 'name',
      dvt: 'unit',
      donvi: 'unit',
      dongiale: 'sellPriceDefault',
      dongiasi: 'sellPriceWholesale',
      giavon: 'avgCost',
      tondau: 'openingStock',
    },
    requiredFields: ['name', 'unit'],
    requiredLabels: { name: 'Ten_hang', unit: 'DVT' },
    buildItem: (raw) => {
      const name = String(raw.name || '').trim();
      const unit = String(raw.unit || '').trim();
      if (!name || !unit) return null;
      const code = String(raw.code || '').trim() || buildCodeFromName(name);
      return {
        id: uuid(),
        code,
        name,
        unit,
        sellPriceDefault: parseImportNumber(raw.sellPriceDefault),
        sellPriceWholesale: parseImportNumber(raw.sellPriceWholesale),
        avgCost: parseImportNumber(raw.avgCost),
        openingStock: parseImportNumber(raw.openingStock),
        createdAt: new Date().toISOString(),
      };
    },
  },
  customers: {
    columnMap: {
      stt: null,
      ten: 'name',
      sodienthoai: 'phone',
      sdt: 'phone',
      dienthoai: 'phone',
      phone: 'phone',
      diachi: 'address',
      address: 'address',
    },
    requiredFields: ['name'],
    requiredLabels: { name: 'Ten' },
    buildItem: (raw) => {
      const name = String(raw.name || '').trim();
      if (!name) return null;
      return {
        id: uuid(),
        name,
        phone: String(raw.phone || '').trim(),
        address: String(raw.address || '').trim(),
      };
    },
  },
  suppliers: {
    columnMap: {
      stt: null,
      ten: 'name',
      sodienthoai: 'phone',
      sdt: 'phone',
      dienthoai: 'phone',
      phone: 'phone',
      diachi: 'address',
      address: 'address',
    },
    requiredFields: ['name'],
    requiredLabels: { name: 'Ten' },
    buildItem: (raw) => {
      const name = String(raw.name || '').trim();
      if (!name) return null;
      return {
        id: uuid(),
        name,
        phone: String(raw.phone || '').trim(),
        address: String(raw.address || '').trim(),
      };
    },
  },
  units: {
    columnMap: {
      stt: null,
      dvt: 'name',
      donvi: 'name',
    },
    requiredFields: ['name'],
    requiredLabels: { name: 'DVT' },
    buildItem: (raw) => {
      const name = String(raw.name || '').trim();
      if (!name) return null;
      return {
        id: uuid(),
        name,
        createdAt: new Date().toISOString(),
      };
    },
  },
};
