import { computeStock } from '../../../utils/stock.js';
import { computeCustomerDebtBeforeDateByInvoiceOrder } from '../../../utils/customerDebt.js';
import {
  findInvoices,
  findPayments,
  findProducts,
  findPurchases,
} from '../repositories/sales.repository.js';

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const buildProductSearchFilter = (search) => {
  const trimmed = String(search || '').trim();
  if (!trimmed) return {};
  const terms = trimmed.split(/\s+/).filter(Boolean);
  if (!terms.length) return {};
  const buildOr = (regex) => [
    { name: regex },
    { code: regex },
    { group: regex },
    { unit: regex },
    { spec: regex },
  ];
  return {
    $and: terms.map((term) => {
      const regex = new RegExp(escapeRegex(term), 'i');
      return { $or: buildOr(regex) };
    }),
  };
};

export const getProductsForSales = async (query) => {
  const rawLimit = Number(query.limit || 30);
  const limit = Number.isFinite(rawLimit)
    ? Math.min(Math.max(rawLimit, 1), 200)
    : 30;
  const searchFilter = buildProductSearchFilter(query.search);
  const filter = {
    isDeleted: { $ne: true },
    ...searchFilter,
  };

  const [products, purchases, invoices] = await Promise.all([
    findProducts(filter, { sort: { name: 1 }, limit }),
    findPurchases({ isDeleted: { $ne: true } }),
    findInvoices({ isDeleted: { $ne: true } }),
  ]);

  return products.map((product) => ({
    ...product,
    stock: computeStock(product.id, purchases, invoices, products),
  }));
};

export const getCustomerDebtForSales = async (query) => {
  const customerId = String(query.customerId || '').trim();
  if (!customerId) throw new Error('customerId is required');

  const excludeInvoiceId = String(query.excludeInvoiceId || '').trim();
  const asOfDate = String(query.asOfDate || '').trim();

  const invoices = await findInvoices({ customerId, isDeleted: { $ne: true } });
  const invoiceIds = invoices.map((invoice) => invoice.id);
  const payments = await findPayments({
    isDeleted: { $ne: true },
    $or: [
      ...(invoiceIds.length ? [{ invoiceId: { $in: invoiceIds } }] : []),
      { customerId, paymentType: 'debt_receipt' },
    ],
  });

  if (excludeInvoiceId || asOfDate) {
    const targetInvoice = excludeInvoiceId
      ? invoices.find((invoice) => invoice.id === excludeInvoiceId) || null
      : null;
    const effectiveExcludeInvoiceId =
      targetInvoice?.customerId === customerId ? excludeInvoiceId : '';
    const effectiveAsOfDate = asOfDate || targetInvoice?.date || '';

    if (effectiveAsOfDate) {
      const debt = computeCustomerDebtBeforeDateByInvoiceOrder({
        invoices,
        payments,
        customerId,
        asOfDate: effectiveAsOfDate,
        excludeInvoiceId: effectiveExcludeInvoiceId,
      });
      return {
        customerId,
        total: debt,
        paid: 0,
        invoicePaid: 0,
        debtReceiptPaid: 0,
        debt,
      };
    }
  }

  const invoicePayments = payments.filter(
    (payment) => payment.invoiceId && payment.paymentType !== 'debt_receipt'
  );
  const debtReceipts = payments.filter(
    (payment) => payment.paymentType === 'debt_receipt'
  );
  const total = invoices.reduce(
    (sum, invoice) => sum + Number(invoice.total || 0),
    0
  );
  const invoicePaid = invoicePayments.reduce(
    (sum, payment) => sum + Number(payment.amount || 0),
    0
  );
  const debtReceiptPaid = debtReceipts.reduce(
    (sum, payment) => sum + Number(payment.amount || 0),
    0
  );
  const paid = invoicePaid + debtReceiptPaid;

  return {
    customerId,
    total,
    paid,
    invoicePaid,
    debtReceiptPaid,
    debt: total - paid,
  };
};
