// Fields whose change means an issued e-invoice no longer matches the sale.
// Payment status / payments are deliberately excluded.
const CONTENT_FIELDS = ['customerId', 'date', 'total', 'discountTotal'];
const LINE_FIELDS = [
  'productId',
  'qty',
  'unitPrice',
  'lineTotal',
  'length',
  'width',
  'lineNote',
];

const normalize = (value) => {
  if (value === undefined || value === null || value === '') return null;
  if (typeof value === 'number') return value;
  const number = Number(value);
  return typeof value === 'string' && Number.isFinite(number) ? number : value;
};

const contentOf = (invoice = {}) => ({
  fields: CONTENT_FIELDS.map((field) => normalize(invoice[field])),
  lines: (invoice.items || []).map((item) =>
    LINE_FIELDS.map((field) => normalize(item?.[field]))
  ),
});

export const isExported = (invoice) => Boolean(invoice?.einvoice?.exportedAt);

export const hasContentChange = (before, after) =>
  JSON.stringify(contentOf(before)) !== JSON.stringify(contentOf(after));

// `$set` patch for the invoices service; `after === null` means deleted.
export const buildChangeFlagPatch = (before, after) =>
  isExported(before) && (after === null || hasContentChange(before, after))
    ? { 'einvoice.changedAfterExport': true }
    : {};

// `einvoice` is server-owned: never accept it from client payloads.
export const stripEinvoiceFields = (payload = {}) =>
  Object.fromEntries(
    Object.entries(payload).filter(([key]) => key !== 'einvoice')
  );
