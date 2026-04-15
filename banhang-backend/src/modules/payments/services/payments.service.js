import { v4 as uuid } from 'uuid';
import {
  ensureActive,
  sanitizePayload,
} from '../../../services/crud.service.js';
import {
  createPayment,
  findPaymentById,
  findPayments,
  insertPayments,
  softDeletePayment,
  upsertPayment,
} from '../repositories/payments.repository.js';

export const getAllPayments = async (includeDeleted) => {
  const filter = includeDeleted ? {} : { isDeleted: { $ne: true } };
  return findPayments(filter);
};

export const getPayment = async (id) => findPaymentById(id);

export const createPaymentItem = async (payload) => {
  const cleanPayload = ensureActive(sanitizePayload(payload));
  if (!cleanPayload.id) cleanPayload.id = uuid();
  return createPayment(cleanPayload);
};

export const bulkCreatePayments = async (items) => {
  const payload = items.map((item) => {
    const clean = ensureActive(sanitizePayload(item));
    return { ...clean, id: clean.id || uuid() };
  });
  return insertPayments(payload);
};

export const updatePaymentItem = async (id, payload) => {
  const cleanPayload = sanitizePayload(payload);
  const existing = await findPaymentById(id);

  if (existing?.paymentType === 'debt_receipt') {
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
        'Không thể đổi khách hàng hoặc loại của phiếu thu nợ đã tạo.'
      );
    }
  }

  return upsertPayment(id, cleanPayload);
};

export const deletePaymentItem = async (id) => {
  const deletedAt = new Date().toISOString();
  return softDeletePayment(id, deletedAt);
};
