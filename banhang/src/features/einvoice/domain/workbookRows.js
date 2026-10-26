import * as XLSX from 'xlsx';

// Uploaded Excel file → [{ name, rows }]. Cells are displayed text, or raw
// values with `raw: true` (numbers, dates as Excel serial numbers).
export const readWorkbookRows = (arrayBuffer, { raw = false } = {}) => {
  const workbook = XLSX.read(arrayBuffer, { type: 'array' });
  return workbook.SheetNames.map((name) => ({
    name,
    rows: XLSX.utils.sheet_to_json(workbook.Sheets[name], {
      header: 1,
      defval: '',
      raw,
      blankrows: true,
    }),
  }));
};

// Excel serial date → 'YYYY-MM-DD' (no time zone involved).
export const serialToDay = (serial) => {
  const parsed = XLSX.SSF.parse_date_code(serial);
  if (!parsed) return '';
  const pad = (value) => String(value).padStart(2, '0');
  return `${parsed.y}-${pad(parsed.m)}-${pad(parsed.d)}`;
};

// The sheet with the most filled cells (templates may have help sheets).
export const pickMainSheet = (sheets) =>
  sheets.reduce((best, sheet) => {
    const count = (rows) =>
      rows.flat().filter((cell) => String(cell).trim() !== '').length;
    return !best || count(sheet.rows) > count(best.rows) ? sheet : best;
  }, null);
