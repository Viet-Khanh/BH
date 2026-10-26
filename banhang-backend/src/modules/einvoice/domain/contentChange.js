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

const REQUEST_FIELDS = [
  'buyerName',
  'companyName',
  'taxCode',
  'address',
  'email',
];

// Counter buyer data is content too; "not requested" equals "no request".
const requestOf = (request) =>
  request?.requested
    ? REQUEST_FIELDS.map((field) => String(request[field] || '').trim())
    : null;

const contentOf = (invoice = {}) => ({
  fields: CONTENT_FIELDS.map((field) => normalize(invoice[field])),
  request: requestOf(invoice.einvoiceRequest),
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

// Error for a change refused by the "lock exported invoices" setting (HTTP 409).
export class EinvoiceLockedError extends Error {
  constructor(message) {
    super(message);
    this.status = 409;
  }
}

// Message when the lock setting forbids this change, else null.
export const lockViolation = (before, after, settings = {}) => {
  if (!settings.einvoiceLockExported || !isExported(before)) return null;
  if (after === null)
    return 'Hoá đơn đã xuất hoá đơn điện tử nên không xoá được (đang bật khoá). Vào Hoá đơn điện tử → "Bỏ đánh dấu" nếu thật sự cần.';
  return hasContentChange(before, after)
    ? 'Hoá đơn đã xuất hoá đơn điện tử nên không sửa được nội dung (đang bật khoá). Vào Hoá đơn điện tử → "Bỏ đánh dấu" nếu thật sự cần.'
    : null;
};

// `einvoice` is server-owned: never accept it from client payloads.
export const stripEinvoiceFields = (payload = {}) =>
  Object.fromEntries(
    Object.entries(payload).filter(([key]) => key !== 'einvoice')
  );
