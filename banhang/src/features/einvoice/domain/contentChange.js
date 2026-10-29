// Mirrors banhang-backend/src/modules/einvoice/domain/contentChange.js
// (parity checked in __tests__/contentChange.test.js): lets the sales screen
// skip the e-invoice warning when only payments change.
const CONTENT_FIELDS = ['customerId', 'date', 'total', 'discountTotal'];
const LINE_FIELDS = [
  'productId',
  'qty',
  'unitName',
  'factor',
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

export const hasContentChange = (before, after) =>
  JSON.stringify(contentOf(before)) !== JSON.stringify(contentOf(after));
