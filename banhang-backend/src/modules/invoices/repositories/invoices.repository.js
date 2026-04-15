import Invoice from '../../../models/Invoice.js';

export const findInvoices = async (filter) => Invoice.find(filter).lean();

export const findInvoiceById = async (id) => Invoice.findOne({ id }).lean();

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
