import { v4 as uuid } from 'uuid';
import {
  ensureActive,
  sanitizePayload,
} from '../../../services/crud.service.js';
import {
  createInvoice,
  findInvoiceById,
  findInvoices,
  insertInvoices,
  softDeleteInvoice,
  upsertInvoice,
} from '../repositories/invoices.repository.js';

export const getAllInvoices = async (includeDeleted) => {
  const filter = includeDeleted ? {} : { isDeleted: { $ne: true } };
  return findInvoices(filter);
};

export const getInvoice = async (id) => findInvoiceById(id);

export const createInvoiceItem = async (payload) => {
  const cleanPayload = ensureActive(sanitizePayload(payload));
  if (!cleanPayload.id) cleanPayload.id = uuid();
  return createInvoice(cleanPayload);
};

export const bulkCreateInvoices = async (items) => {
  const payload = items.map((item) => {
    const clean = ensureActive(sanitizePayload(item));
    return { ...clean, id: clean.id || uuid() };
  });
  return insertInvoices(payload);
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

  return upsertInvoice(id, cleanPayload);
};

export const deleteInvoiceItem = async (id) => {
  const deletedAt = new Date().toISOString();
  return softDeleteInvoice(id, deletedAt);
};
