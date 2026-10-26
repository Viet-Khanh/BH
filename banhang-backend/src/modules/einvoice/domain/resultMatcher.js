// Matches rows of the provider's issued-invoice list to exported sales.
// Row: { rowNumber, ref, day ('YYYY-MM-DD', local), total, number, series,
// taxAuthorityCode, lookupCode }. Ref = app invoice code (exported in the
// file, e.g. "Số đơn hàng" / invoice note); else same local day + total, only
// when exactly one exported sale without number fits.
const localDay = (iso, utcOffsetMinutes) =>
  new Date(Date.parse(iso) + utcOffsetMinutes * 60000)
    .toISOString()
    .slice(0, 10);

const sameAmount = (a, b) =>
  Math.round(Number(a || 0)) === Math.round(Number(b || 0));

const isExported = (invoice) => Boolean(invoice.einvoice?.exportedAt);

export const matchResults = (
  rows,
  invoices,
  { utcOffsetMinutes = 420 } = {}
) => {
  const used = new Set();
  const result = { matched: [], unmatched: [], ambiguous: [] };
  const settle = (row, candidates) => {
    if (candidates.length === 1) {
      used.add(candidates[0].id);
      result.matched.push({
        row,
        invoiceId: candidates[0].id,
        code: candidates[0].code || '',
      });
    } else if (candidates.length > 1) {
      result.ambiguous.push({
        row,
        codes: candidates.map((invoice) => invoice.code),
      });
    } else {
      result.unmatched.push(row);
    }
  };
  rows.forEach((row) => {
    const ref = String(row.ref || '').trim();
    if (ref) {
      const byRef = invoices.filter((invoice) => invoice.code === ref);
      if (byRef.length) {
        settle(row, byRef);
        return;
      }
    }
    const candidates =
      row.day && row.total !== undefined && row.total !== ''
        ? invoices.filter(
            (invoice) =>
              isExported(invoice) &&
              !invoice.einvoice?.number &&
              !used.has(invoice.id) &&
              localDay(invoice.date, utcOffsetMinutes) === row.day &&
              sameAmount(invoice.total, row.total)
          )
        : [];
    settle(row, candidates);
  });
  return result;
};
