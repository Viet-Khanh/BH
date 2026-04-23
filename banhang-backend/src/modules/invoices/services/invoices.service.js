import { v4 as uuid } from 'uuid';
import {
  ensureActive,
  sanitizePayload,
} from '../../../services/crud.service.js';
import {
  createInvoice,
  findInvoiceById,
  findInvoices,
  findPayments,
  restoreInvoiceById,
  restorePaymentsByInvoiceId,
  softDeleteInvoice,
  softDeletePaymentsByInvoiceId,
  upsertInvoice,
} from '../repositories/invoices.repository.js';
import {
  applyCustomerDebtDeltas,
  buildInvoiceDebtDelta,
  buildPaymentDebtDelta,
  hydratePaymentCustomer,
  invertDebtDeltas,
} from '../../../services/customerDebtSnapshot.service.js';
import {
  applyStockDeltas,
  buildInvoiceCreateStockDeltas,
  buildInvoiceDeleteStockDeltas,
  buildItemUpdateStockDeltas,
  invertStockDeltas,
} from '../../../services/stockSnapshot.service.js';

const applyInvoiceSnapshot = async ({ stockDeltas = [], debtDeltas = [] }) => {
  const stockResult = await applyStockDeltas(stockDeltas);
  try {
    const debtResult = await applyCustomerDebtDeltas(debtDeltas);
    return { stockResult, debtResult };
  } catch (error) {
    if (stockResult.applied) {
      await applyStockDeltas(invertStockDeltas(stockResult.deltas), {
        force: true,
      });
    }
    throw error;
  }
};

const rollbackInvoiceSnapshot = async (snapshotResult) => {
  if (snapshotResult?.debtResult?.applied) {
    await applyCustomerDebtDeltas(
      invertDebtDeltas(snapshotResult.debtResult.deltas),
      { force: true }
    );
  }
  if (snapshotResult?.stockResult?.applied) {
    await applyStockDeltas(
      invertStockDeltas(snapshotResult.stockResult.deltas),
      { force: true }
    );
  }
};

export const getAllInvoices = async (includeDeleted) => {
  const filter = includeDeleted ? {} : { isDeleted: { $ne: true } };
  return findInvoices(filter);
};

export const getInvoice = async (id) => findInvoiceById(id);

export const createInvoiceItem = async (payload) => {
  const cleanPayload = ensureActive(sanitizePayload(payload));
  if (!cleanPayload.id) cleanPayload.id = uuid();
  const snapshotResult = await applyInvoiceSnapshot({
    stockDeltas: buildInvoiceCreateStockDeltas(cleanPayload.items || []),
    debtDeltas: buildInvoiceDebtDelta(cleanPayload),
  });
  try {
    return await createInvoice(cleanPayload);
  } catch (error) {
    await rollbackInvoiceSnapshot(snapshotResult);
    throw error;
  }
};

export const bulkCreateInvoices = async (items) => {
  const docs = [];
  for (const item of items) {
    docs.push(await createInvoiceItem(item));
  }
  return docs;
};

export const updateInvoiceItem = async (id, payload) => {
  const cleanPayload = sanitizePayload(payload);
  const existing = await findInvoiceById(id);

  if (
    existing &&
    cleanPayload.customerId !== undefined &&
    String(cleanPayload.customerId || '') !== String(existing.customerId || '')
  ) {
    throw new Error('Không thể đổi khách hàng của hóa đơn đã tạo.');
  }

  const nextInvoice = { ...(existing || {}), ...cleanPayload, id };
  const stockDeltas = existing
    ? buildItemUpdateStockDeltas(existing.items || [], nextInvoice.items || [])
    : buildInvoiceCreateStockDeltas(nextInvoice.items || []);
  const debtDeltas =
    existing && cleanPayload.total !== undefined
      ? buildInvoiceDebtDelta({
          ...nextInvoice,
          total: Number(nextInvoice.total || 0) - Number(existing.total || 0),
        })
      : existing
        ? []
        : buildInvoiceDebtDelta(nextInvoice);

  const snapshotResult = await applyInvoiceSnapshot({
    stockDeltas,
    debtDeltas,
  });
  try {
    return await upsertInvoice(id, cleanPayload);
  } catch (error) {
    await rollbackInvoiceSnapshot(snapshotResult);
    throw error;
  }
};

export const deleteInvoiceItem = async (id) => {
  const deletedAt = new Date().toISOString();
  const existing = await findInvoiceById(id);
  if (!existing) return null;
  if (existing.isDeleted) return existing;

  const payments = await findPayments({
    invoiceId: id,
    isDeleted: { $ne: true },
  });
  const hydratedPayments = await Promise.all(
    payments.map(hydratePaymentCustomer)
  );
  const debtDeltas = [
    ...buildInvoiceDebtDelta(existing, -1),
    ...hydratedPayments.flatMap((payment) =>
      buildPaymentDebtDelta(payment, -1)
    ),
  ];
  const snapshotResult = await applyInvoiceSnapshot({
    stockDeltas: buildInvoiceDeleteStockDeltas(existing.items || []),
    debtDeltas,
  });
  let invoiceDeleted = false;
  let paymentsDeleted = false;
  try {
    const invoice = await softDeleteInvoice(id, deletedAt);
    if (!invoice) throw new Error('Invoice not found');
    invoiceDeleted = true;
    await softDeletePaymentsByInvoiceId(id, deletedAt);
    paymentsDeleted = true;
    return invoice;
  } catch (error) {
    try {
      if (paymentsDeleted) {
        await restorePaymentsByInvoiceId(
          id,
          payments.map((payment) => payment.id).filter(Boolean)
        );
      }
      if (invoiceDeleted) {
        await restoreInvoiceById(id);
      }
    } finally {
      await rollbackInvoiceSnapshot(snapshotResult);
    }
    throw error;
  }
};
