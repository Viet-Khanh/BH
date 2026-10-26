import { buildAdjustment } from '../domain/adjustment.js';
import { diffDocuments } from '../domain/documentDiff.js';
import { buildDocument } from '../domain/documentBuilder.js';
import { einvoiceStatus } from '../domain/status.js';
import { validateDocument } from '../domain/validation.js';
import {
  findCustomersByIds,
  findMainSettings,
  findPaymentsByInvoiceIds,
  findProductsByIds,
} from '../repositories/einvoice.repository.js';

// Shared document building: export, adjustments, results, summary and report
// all see exactly the same documents.
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

export const loadSettings = async () => (await findMainSettings()) || {};

// The snapshot can be large; clients get the diff instead.
export const publicEinvoice = (einvoice) =>
  einvoice
    ? Object.fromEntries(
        Object.entries(einvoice).filter(([key]) => key !== 'snapshot')
      )
    : null;

const loadRelations = async (invoices) => {
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
  return {
    customerById: byId(customers),
    productById: byId(products),
    paymentsByInvoice: groupByInvoice(payments),
  };
};

export const buildItems = async (invoices, settings) => {
  const { customerById, productById, paymentsByInvoice } =
    await loadRelations(invoices);
  return invoices.map((invoice) => {
    const document = buildDocument({
      invoice,
      customer: customerById.get(invoice.customerId),
      productById,
      payments: paymentsByInvoice.get(invoice.id) || [],
      settings,
    });
    const status = einvoiceStatus(invoice);
    const deleted = Boolean(invoice.isDeleted);
    const issues = validateDocument(document);
    const changed = status === 'changed';
    return {
      invoiceId: invoice.id,
      code: invoice.code || '',
      date: invoice.date,
      status,
      deleted,
      einvoice: publicEinvoice(invoice.einvoice),
      issues,
      document,
      diff: changed
        ? diffDocuments(invoice.einvoice?.snapshot, deleted ? null : document)
        : null,
      adjustment: changed ? buildAdjustment(invoice, document, issues) : null,
    };
  });
};
