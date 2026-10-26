// Data for the adjustment / replacement e-invoice of a sale changed after
// export: edited sale → "replace" with the current content; deleted sale →
// "reduce" (adjust down) with the exported content. Needs the original
// invoice number (entered by hand or imported from the provider).
const error = (message) => ({ level: 'error', message });

export const buildAdjustment = (invoice, document, documentIssues = []) => {
  const einvoice = invoice.einvoice || {};
  const snapshot = einvoice.snapshot || null;
  const deleted = Boolean(invoice.isDeleted);
  const kind = deleted ? 'reduce' : 'replace';
  const base = deleted ? snapshot : document;
  const original = {
    originalNumber: einvoice.number || '',
    originalSeries: einvoice.series || '',
    originalDate: snapshot?.date || invoice.date,
  };
  const issues = [];
  if (!original.originalNumber)
    issues.push(
      error(
        'Chưa có số hoá đơn gốc: nhập "Số HĐĐT" hoặc nhập kết quả từ nhà cung cấp trước.'
      )
    );
  if (!base)
    issues.push(
      error('Không có bản chụp lúc xuất nên không lập được dữ liệu điều chỉnh.')
    );
  if (!deleted)
    issues.push(...documentIssues.filter((issue) => issue.level === 'error'));
  return {
    kind,
    original,
    document: base ? { ...base, adjustment: { kind, ...original } } : null,
    issues,
  };
};

// History entry stored in einvoice.adjustments when the file is exported.
export const adjustmentEntry = (adjustment, { at, batchId, profile }) => ({
  at,
  batchId,
  profile,
  kind: adjustment.kind,
  ...adjustment.original,
});
