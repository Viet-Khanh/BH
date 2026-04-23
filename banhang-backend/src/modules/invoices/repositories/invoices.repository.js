import Invoice from '../../../models/Invoice.js';
import Payment from '../../../models/Payment.js';

export const findInvoices = async (filter) => Invoice.find(filter).lean();

export const findInvoiceById = async (id) => Invoice.findOne({ id }).lean();

export const findPayments = async (filter) => Payment.find(filter).lean();

export const createInvoice = async (payload) => Invoice.create(payload);

export const insertInvoices = async (payload) =>
  Invoice.insertMany(payload, { ordered: false });

export const upsertInvoice = async (id, payload) =>
  Invoice.findOneAndUpdate(
    { id },
    { $set: { ...payload, id } },
    { new: true, upsert: true }
  ).lean();

export const softDeleteInvoice = async (id, deletedAt) =>
  Invoice.findOneAndUpdate(
    { id },
    { $set: { isDeleted: true, deletedAt } },
    { new: true }
  ).lean();

export const softDeletePaymentsByInvoiceId = async (invoiceId, deletedAt) =>
  Payment.updateMany({ invoiceId }, { $set: { isDeleted: true, deletedAt } });

export const restoreInvoiceById = async (id) =>
  Invoice.findOneAndUpdate(
    { id },
    { $set: { isDeleted: false, deletedAt: null } },
    { new: true }
  ).lean();

export const restorePaymentsByInvoiceId = async (
  invoiceId,
  paymentIds = []
) => {
  if (!paymentIds.length) return { modifiedCount: 0 };
  return Payment.updateMany(
    { invoiceId, id: { $in: paymentIds } },
    { $set: { isDeleted: false, deletedAt: null } }
  );
};
