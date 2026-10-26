import { columnValue } from './fields/index.js';

// Data profile → sheet rows: preamble rows, header, optional sub-header (e.g.
// Viettel's field keys), then one row per document line.
// Profile: { id, name, purpose, sheetName, preamble?, columns: [{ header,
// field, format?, constant?, firstLineOnly?, onlyFor?, subHeader?, prompt? }] }
export const profileColumns = (profile, taxMethod) =>
  profile.columns.filter(
    (column) => !column.onlyFor || column.onlyFor === taxMethod
  );

export const applyProfile = (profile, documents, { taxMethod }) => {
  const columns = profileColumns(profile, taxMethod);
  const header = columns.map((column) => column.header);
  const subHeader = columns.some((column) => column.subHeader)
    ? [columns.map((column) => column.subHeader || '')]
    : [];
  const body = documents.flatMap((doc, docIndex) =>
    doc.lines.map((line, lineIndex) =>
      columns.map((column) =>
        columnValue(column, { doc, line, lineIndex, seq: docIndex + 1 })
      )
    )
  );
  return {
    sheetName: profile.sheetName || 'Sheet1',
    rows: [...(profile.preamble || []), header, ...subHeader, ...body],
  };
};

const rateCount = (doc) =>
  new Set(doc.lines.map((line) => line.vatRate).filter(Boolean)).size;

// Problems that stop an export with this profile: columns the shop must fill
// (e.g. invoice series) and single-rate templates.
export const profileProblems = (profile) =>
  profile.columns
    .filter((column) => column.prompt && !String(column.constant || '').trim())
    .map(
      (column) =>
        `Mẫu "${profile.name}" cần điền cột "${column.header}" (${column.prompt}): vào tab Mẫu file → Sao chép mẫu rồi điền.`
    );

export const documentProblems = (profile, doc) =>
  profile.singleVatRate && rateCount(doc) > 1
    ? [`Mẫu "${profile.name}" chỉ nhận hoá đơn một thuế suất.`]
    : [];
