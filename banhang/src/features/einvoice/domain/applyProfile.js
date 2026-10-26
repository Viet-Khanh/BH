// Turns e-invoice documents into spreadsheet rows (array of arrays) for a profile.
// Columns marked `onlyFor` are kept only for that tax method.
export const applyProfile = (profile, documents, { taxMethod }) => {
  const columns = profile.columns.filter(
    (column) => !column.onlyFor || column.onlyFor === taxMethod
  );
  const header = columns.map((column) => column.header);
  const body = documents.flatMap((doc) =>
    doc.lines.map((line, lineIndex) =>
      columns.map((column) => column.value(doc, line, lineIndex) ?? '')
    )
  );
  return { sheetName: profile.sheetName, rows: [header, ...body] };
};
