import { compactHeader } from './headerMatching.js';
import { serialToDay } from './workbookRows.js';

// Columns of the provider's issued-invoice list the import understands.
export const RESULT_KEYS = [
  {
    key: 'number',
    label: 'Số hoá đơn',
    required: true,
    synonyms: ['sohoadon', 'sohd', 'so'],
  },
  { key: 'series', label: 'Ký hiệu', synonyms: ['kyhieu', 'kyhieuhoadon'] },
  {
    key: 'taxAuthorityCode',
    label: 'Mã CQT',
    synonyms: ['macqt', 'macuacqt', 'macoquanthue'],
  },
  { key: 'lookupCode', label: 'Mã tra cứu', synonyms: ['matracuu', 'mabimat'] },
  {
    key: 'ref',
    label: 'Mã HĐ trong app',
    synonyms: [
      'mahd',
      'mahdapp',
      'sodonhang',
      'mathamchieu',
      'nhomhoadon',
      'ghichu',
    ],
  },
  {
    key: 'date',
    label: 'Ngày hoá đơn',
    synonyms: ['ngayhoadon', 'ngayhd', 'ngaylap'],
  },
  {
    key: 'total',
    label: 'Tổng tiền thanh toán',
    synonyms: [
      'tongtienthanhtoan',
      'tongthanhtoan',
      'tongcongtienthanhtoan',
      'tongtien',
    ],
  },
];

// key → column index (or undefined), first exact header match wins.
export const guessResultMapping = (headers = []) => {
  const compact = headers.map(compactHeader);
  return Object.fromEntries(
    RESULT_KEYS.map(({ key, synonyms }) => {
      const index = synonyms
        .map((synonym) => compact.indexOf(synonym))
        .find((position) => position >= 0);
      return [key, index];
    })
  );
};

const DMY = /^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})/;
const YMD = /^(\d{4})-(\d{2})-(\d{2})/;

// Provider dates: Excel serials, dd/mm/yyyy (with optional time) or ISO.
export const parseDay = (value) => {
  if (typeof value === 'number') return serialToDay(value);
  const text = String(value ?? '').trim();
  const dmy = text.match(DMY);
  if (dmy)
    return `${dmy[3]}-${dmy[2].padStart(2, '0')}-${dmy[1].padStart(2, '0')}`;
  const ymd = text.match(YMD);
  return ymd ? `${ymd[1]}-${ymd[2]}-${ymd[3]}` : '';
};

// VND amounts: numbers, or text with thousand separators ("1.250.000").
export const parseAmount = (value) => {
  if (typeof value === 'number') return Math.round(value);
  const digits = String(value ?? '').replace(/[^\d-]/g, '');
  return digits ? Number(digits) : undefined;
};

const text = (value) => String(value ?? '').trim();

// Data rows below the header → rows for POST /einvoice/results.
export const toResultRows = (rows, headerRowIndex, mapping) =>
  rows
    .slice(headerRowIndex + 1)
    .map((row, offset) => {
      const cell = (key) =>
        mapping[key] === undefined ? '' : row[mapping[key]];
      return {
        rowNumber: headerRowIndex + offset + 2,
        number: text(cell('number')),
        series: text(cell('series')),
        taxAuthorityCode: text(cell('taxAuthorityCode')),
        lookupCode: text(cell('lookupCode')),
        ref: text(cell('ref')),
        day: parseDay(cell('date')),
        total: parseAmount(cell('total')),
      };
    })
    .filter((row) => row.number || row.ref);
