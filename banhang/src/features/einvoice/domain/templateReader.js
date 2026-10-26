import { guessColumn } from './headerMatching.js';

// Reads a provider's Excel import template (rows as arrays) into a draft
// profile: preamble rows, header row → guessed columns, optional key row.
const SCAN_ROWS = 15;
const KEY = /^[A-Za-z][A-Za-z0-9_]*$/;

const filled = (row = []) =>
  row.filter((cell) => String(cell ?? '').trim() !== '');

// The header is the first of the fullest rows near the top.
export const detectHeaderRow = (rows) => {
  let best = 0;
  rows.slice(0, SCAN_ROWS).forEach((row, index) => {
    if (filled(row).length > filled(rows[best]).length) best = index;
  });
  return best;
};

// A row of programmatic keys under the header (e.g. Viettel's "itemNo").
export const looksLikeKeyRow = (row = []) => {
  const cells = filled(row).map((cell) => String(cell).trim());
  return (
    cells.length >= 3 &&
    cells.filter((cell) => KEY.test(cell)).length >= cells.length * 0.8
  );
};

const text = (cell) => String(cell ?? '').trim();

export const buildProfileFromTemplate = ({
  rows,
  sheetName,
  headerRowIndex = detectHeaderRow(rows),
  keyRow = looksLikeKeyRow(rows[headerRowIndex + 1]),
  name,
}) => {
  const header = rows[headerRowIndex] || [];
  const keys = keyRow ? rows[headerRowIndex + 1] || [] : [];
  const width = header.length;
  return {
    id: `custom-${Date.now().toString(36)}`,
    name: name || `Mẫu ${sheetName}`,
    purpose: 'issue',
    sheetName,
    preamble: rows.slice(0, headerRowIndex).map((row) => row.map(text)),
    columns: Array.from({ length: width }, (_, index) => ({
      ...guessColumn(header[index]),
      ...(keyRow && text(keys[index]) ? { subHeader: text(keys[index]) } : {}),
    })),
  };
};
