import * as XLSX from 'xlsx';

// Uploaded Excel file → [{ name, rows }] (cells as displayed text).
export const readWorkbookRows = (arrayBuffer) => {
  const workbook = XLSX.read(arrayBuffer, { type: 'array', cellDates: true });
  return workbook.SheetNames.map((name) => ({
    name,
    rows: XLSX.utils.sheet_to_json(workbook.Sheets[name], {
      header: 1,
      defval: '',
      raw: false,
      blankrows: true,
    }),
  }));
};

// The sheet with the most filled cells (templates may have help sheets).
export const pickMainSheet = (sheets) =>
  sheets.reduce((best, sheet) => {
    const count = (rows) =>
      rows.flat().filter((cell) => String(cell).trim() !== '').length;
    return !best || count(sheet.rows) > count(best.rows) ? sheet : best;
  }, null);
