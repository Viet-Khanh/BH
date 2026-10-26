// Buyer data taken at the counter when the customer wants an e-invoice
// (`invoice.einvoiceRequest`; the backend prefers it over the customer record).
export const REQUEST_FIELDS = [
  'companyName',
  'taxCode',
  'buyerName',
  'address',
  'email',
];

const WALK_IN_NAMES = new Set(['Khách lẻ', 'Khach le']);

export const isWalkInCustomer = (customer) =>
  !customer || WALK_IN_NAMES.has(customer.name);

// Form values: the request when filled, else the customer's own data.
export const initialRequestValues = (request, customer) => {
  const hasData = REQUEST_FIELDS.some((field) => request?.[field]);
  if (hasData)
    return Object.fromEntries(
      REQUEST_FIELDS.map((field) => [field, request[field] || ''])
    );
  const company = Boolean(customer?.taxCode);
  const walkIn = isWalkInCustomer(customer);
  return {
    companyName: company ? customer.name || '' : '',
    taxCode: customer?.taxCode || '',
    buyerName:
      customer?.buyerName || (company || walkIn ? '' : customer?.name || ''),
    address: walkIn ? '' : customer?.address || '',
    email: customer?.email || '',
  };
};

export const toRequest = (values, requested = true) => ({
  requested,
  ...Object.fromEntries(
    REQUEST_FIELDS.map((field) => [field, String(values[field] || '').trim()])
  ),
});

// Fields written back to the customer record ("Lưu vào khách hàng").
export const customerPatch = (request) => ({
  taxCode: request.taxCode,
  email: request.email,
  buyerName: request.buyerName,
  ...(request.address ? { address: request.address } : {}),
});

export const requestSummary = (request) => {
  if (!request?.requested) return '';
  const name = request.companyName || request.buyerName;
  return [name, request.taxCode && `MST ${request.taxCode}`]
    .filter(Boolean)
    .join(' · ');
};
