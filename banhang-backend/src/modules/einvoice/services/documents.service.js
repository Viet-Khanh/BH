import { buildDocument } from '../domain/documentBuilder.js';
import {
  EinvoiceInputError,
  einvoiceStatus,
  STATUSES,
} from '../domain/status.js';
import { validateDocument, validateSettings } from '../domain/validation.js';
import {
  findCustomersByIds,
  findMainSettings,
  findPaymentsByInvoiceIds,
  findProductsByIds,
  findSalesInvoices,
} from '../repositories/einvoice.repository.js';

// Builds e-invoice documents (+ validation) for the invoices of a date range.
const unique = (values) => [...new Set(values.filter(Boolean))];
const byId = (docs) => new Map(docs.map((doc) => [doc.id, doc]));
const groupByInvoice = (payments) =>
  payments.reduce((map, payment) => {
    map.set(payment.invoiceId, [
      ...(map.get(payment.invoiceId) || []),
      payment,
    ]);
    return map;
  }, new Map());

const matchesSearch = (invoice, customer, search) => {
  const keyword = String(search || '')
    .trim()
    .toLowerCase();
  if (!keyword) return true;
  return [invoice.code, customer?.name, customer?.taxCode].some((value) =>
    String(value || '')
      .toLowerCase()
      .includes(keyword)
  );
};

const requireRange = ({ from, to }) => {
  if (!from || !to)
    throw new EinvoiceInputError('Thiếu khoảng ngày (from, to).');
};

export const listDocuments = async ({
  from,
  to,
  status = 'pending',
  search,
}) => {
  requireRange({ from, to });
  if (!STATUSES.includes(status))
    throw new EinvoiceInputError(`Trạng thái không hợp lệ: ${status}`);
  const settings = (await findMainSettings()) || {};
  // Opening-balance imports (importBatchId) are not real sales.
  const invoices = (await findSalesInvoices({ from, to }))
    .filter((invoice) => !invoice.importBatchId)
    .filter(
      (invoice) => status === 'all' || einvoiceStatus(invoice) === status
    );
  const [customers, products, payments] = await Promise.all([
    findCustomersByIds(unique(invoices.map((invoice) => invoice.customerId))),
    findProductsByIds(
      unique(
        invoices.flatMap((invoice) =>
          (invoice.items || []).map((item) => item.productId)
        )
      )
    ),
    findPaymentsByInvoiceIds(invoices.map((invoice) => invoice.id)),
  ]);
  const customerById = byId(customers);
  const productById = byId(products);
  const paymentsByInvoice = groupByInvoice(payments);
  const items = invoices
    .filter((invoice) =>
      matchesSearch(invoice, customerById.get(invoice.customerId), search)
    )
    .map((invoice) => {
      const document = buildDocument({
        invoice,
        customer: customerById.get(invoice.customerId),
        productById,
        payments: paymentsByInvoice.get(invoice.id) || [],
        settings,
      });
      return {
        invoiceId: invoice.id,
        code: invoice.code || '',
        date: invoice.date,
        status: einvoiceStatus(invoice),
        deleted: Boolean(invoice.isDeleted),
        einvoice: invoice.einvoice || null,
        issues: validateDocument(document),
        document,
      };
    });
  return { blocking: validateSettings(settings), items };
};
