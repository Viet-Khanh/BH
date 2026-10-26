import { mapLine } from './lineMapper.js';
import { resolvePaymentMethod } from './paymentMethod.js';
import { splitTax } from './taxCalculator.js';
import { normalizeVatRate } from './vatRates.js';

// Settings with defaults applied (older installs have none of these fields).
export const resolveTaxSettings = (settings = {}) => ({
  taxMethod: settings.taxMethod === 'deduction' ? 'deduction' : 'direct',
  pricesIncludeVat: settings.pricesIncludeVat !== false,
  defaultVatRate: settings.defaultVatRate ?? '8',
});

const buildSeller = (settings) => ({
  taxCode: settings.sellerTaxCode || '',
  locationCode: settings.businessLocationCode || '',
  name: settings.shopName || '',
  address: settings.shopAddress || '',
  phone: settings.shopPhone || '',
});

// Buyer data entered at the counter wins over the customer record (only when
// the customer asked for an e-invoice).
const requestValue = (request, field) =>
  request?.requested ? String(request[field] || '').trim() : '';

// A buyer with a tax code is an organisation; otherwise an individual.
const buildBuyer = (customer = {}, request = null) => {
  const from = (field, fallback = '') =>
    requestValue(request, field) || fallback;
  const taxCode = from('taxCode', customer.taxCode || '');
  const isOrganisation = Boolean(taxCode);
  return {
    name: from(
      'buyerName',
      customer.buyerName || (isOrganisation ? '' : customer.name || '')
    ),
    companyName: isOrganisation ? from('companyName', customer.name || '') : '',
    taxCode,
    address: from('address', customer.address || ''),
    email: from('email', customer.email || ''),
    phone: customer.phone || '',
  };
};

// Product rate wins when set (even if invalid); empty falls back to the default.
const resolveRate = (product, tax) => {
  const productRate = normalizeVatRate(product?.vatRate);
  return productRate === null
    ? normalizeVatRate(tax.defaultVatRate)
    : productRate;
};

// `vatRate` stays undefined when invalid so validation can report it.
const withTax = (line, product, tax) => {
  const rate = resolveRate(product, tax);
  if (!rate) return { ...line, vatRate: rate ?? undefined };
  const split = splitTax({
    amount: line.amount,
    rate,
    pricesIncludeVat: tax.pricesIncludeVat,
  });
  // Providers expect quantity × unit price = amount before tax.
  const unitPriceBeforeTax = line.quantity
    ? Math.round((split.beforeTax / line.quantity) * 100) / 100
    : 0;
  return {
    ...line,
    vatRate: rate,
    beforeTax: split.beforeTax,
    tax: split.tax,
    unitPriceBeforeTax,
  };
};

const sumBy = (lines, key) =>
  lines.reduce((sum, line) => sum + Number(line[key] || 0), 0);

// Provider-agnostic e-invoice document for one sales invoice.
export const buildDocument = ({
  invoice,
  customer,
  productById = new Map(),
  payments = [],
  settings = {},
}) => {
  const tax = resolveTaxSettings(settings);
  const lines = (invoice.items || []).map((item, index) => {
    const product = productById.get(item.productId);
    const line = mapLine(item, product, index + 1);
    return tax.taxMethod === 'deduction' ? withTax(line, product, tax) : line;
  });
  const deduction = tax.taxMethod === 'deduction';
  return {
    invoiceId: invoice.id,
    code: invoice.code || '',
    date: invoice.date,
    taxMethod: tax.taxMethod,
    seller: buildSeller(settings),
    buyer: buildBuyer(customer || {}, invoice.einvoiceRequest),
    requested: Boolean(invoice.einvoiceRequest?.requested),
    paymentMethod: resolvePaymentMethod(payments),
    discount: Number(invoice.discountTotal || 0),
    lines,
    totals: {
      beforeTax: deduction ? sumBy(lines, 'beforeTax') : sumBy(lines, 'amount'),
      tax: deduction ? sumBy(lines, 'tax') : 0,
      total: Number(invoice.total ?? sumBy(lines, 'amount')),
    },
  };
};
