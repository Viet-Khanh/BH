import { v4 as uuid } from 'uuid';
import {
  formatNumberInput as sharedFormatNumberInput,
  parseNumberInput as sharedParseNumberInput,
} from '../../utils/numberInput.js';

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

export const parseNumberInput = sharedParseNumberInput;

export const formatNumberInput = sharedFormatNumberInput;

export const parseImportNumber = (value) => {
  const cleaned = parseNumberInput(value);
  const numeric = Number(cleaned || 0);
  return Number.isNaN(numeric) ? 0 : numeric;
};

export const parseImportNumberOptional = (value) => {
  const cleaned = parseNumberInput(value);
  if (cleaned === '' || cleaned === null || cleaned === undefined) return undefined;
  const numeric = Number(cleaned);
  return Number.isNaN(numeric) ? undefined : numeric;
};

export const buildTemplateRow = (headers) =>
  headers.reduce((acc, header) => {
    acc[header] = '';
    return acc;
  }, {});

export const buildProductPriceUpdateRows = (products = []) =>
  products.map((item) => ({
    Ten_hang: item.name || '',
    Gia_von: item.avgCost ?? '',
    Don_gia_le: item.sellPriceDefault ?? '',
  }));

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

export const PRODUCT_PRICE_UPDATE_TEMPLATE_CONFIG = {
  headers: ['Ten_hang', 'Gia_von', 'Don_gia_le'],
  fileName: 'cap-nhat-gia-san-pham',
  sheetName: 'CapNhatGia',
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

export const PRODUCT_PRICE_UPDATE_IMPORT_CONFIG = {
  columnMap: {
    tenhang: 'name',
    giavon: 'avgCost',
    dongiale: 'sellPriceDefault',
    dongiabanle: 'sellPriceDefault',
    giabanle: 'sellPriceDefault',
  },
  requiredFields: ['name'],
  requiredLabels: { name: 'Ten_hang' },
  buildItem: (raw) => {
    const name = String(raw.name || '').trim();
    if (!name) return null;
    const avgCost = parseImportNumberOptional(raw.avgCost);
    const sellPriceDefault = parseImportNumberOptional(raw.sellPriceDefault);
    if (avgCost === undefined && sellPriceDefault === undefined) return null;

    const item = { name };
    if (avgCost !== undefined) item.avgCost = avgCost;
    if (sellPriceDefault !== undefined) item.sellPriceDefault = sellPriceDefault;
    return item;
  },
};
