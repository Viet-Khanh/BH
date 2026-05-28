import { v4 as uuid } from 'uuid';
import {
  ensureActive,
  sanitizePayload,
} from '../../../services/crud.service.js';
import {
  createPayment,
  findPaymentById,
  findPayments,
  softDeletePayment,
  upsertPayment,
} from '../repositories/payments.repository.js';
import {
  applyCustomerDebtDeltas,
  buildPaymentDebtDelta,
  hydratePaymentCustomer,
  invertDebtDeltas,
} from '../../../services/customerDebtSnapshot.service.js';

const applyPaymentSnapshot = async (deltas) => applyCustomerDebtDeltas(deltas);

const rollbackPaymentSnapshot = async (snapshotResult) => {
  if (snapshotResult?.applied) {
    await applyCustomerDebtDeltas(invertDebtDeltas(snapshotResult.deltas), {
      force: true,
    });
  }
};

export const getAllPayments = async (includeDeleted) => {
  const filter = includeDeleted ? {} : { isDeleted: { $ne: true } };
  return findPayments(filter);
};

export const getPayment = async (id) => findPaymentById(id);

export const createPaymentItem = async (payload) => {
  let cleanPayload = ensureActive(sanitizePayload(payload));
  if (!cleanPayload.id) cleanPayload.id = uuid();
  cleanPayload = await hydratePaymentCustomer(cleanPayload);
  const snapshotResult = await applyPaymentSnapshot(
    buildPaymentDebtDelta(cleanPayload)
  );
  try {
    return await createPayment(cleanPayload);
  } catch (error) {
    await rollbackPaymentSnapshot(snapshotResult);
    throw error;
  }
};

export const bulkCreatePayments = async (items) => {
  const docs = [];
  for (const item of items) {
    docs.push(await createPaymentItem(item));
  }
  return docs;
};

export const updatePaymentItem = async (id, payload) => {
  const cleanPayload = sanitizePayload(payload);
  const existing = await findPaymentById(id);

  if (
    existing?.paymentType === 'debt_receipt' ||
    existing?.paymentType === 'supplier_debt_payment'
  ) {
    const immutableFields = [
      'customerId',
      'paymentType',
      'invoiceId',
      'purchaseId',
      'supplierId',
      'code',
    ];
    const changedField = immutableFields.find(
      (field) =>
        cleanPayload[field] !== undefined &&
        String(cleanPayload[field] ?? '') !== String(existing[field] ?? '')
    );
    if (changedField) {
      throw new Error(
        existing.paymentType === 'supplier_debt_payment'
          ? 'Không thể đổi nhà cung cấp hoặc loại của phiếu trả nợ đã tạo.'
          : 'Không thể đổi khách hàng hoặc loại của phiếu thu nợ đã tạo.'
      );
    }
  }

  const oldPayment = await hydratePaymentCustomer(existing || {});
  const nextPayment = await hydratePaymentCustomer({
    ...(existing || {}),
    ...cleanPayload,
    id,
  });
  const deltas = [
    ...buildPaymentDebtDelta(oldPayment, -1),
    ...buildPaymentDebtDelta(nextPayment),
  ];
  const snapshotResult = await applyPaymentSnapshot(deltas);
  try {
    return await upsertPayment(id, cleanPayload);
  } catch (error) {
    await rollbackPaymentSnapshot(snapshotResult);
    throw error;
  }
};

export const deletePaymentItem = async (id) => {
  const deletedAt = new Date().toISOString();
  const existing = await findPaymentById(id);
  if (!existing) return null;
  if (existing.isDeleted) return existing;

  const hydrated = await hydratePaymentCustomer(existing);
  const snapshotResult = await applyPaymentSnapshot(
    buildPaymentDebtDelta(hydrated, -1)
  );
  try {
    const payment = await softDeletePayment(id, deletedAt);
    if (!payment) throw new Error('Payment not found');
    return payment;
  } catch (error) {
    await rollbackPaymentSnapshot(snapshotResult);
    throw error;
  }
};
