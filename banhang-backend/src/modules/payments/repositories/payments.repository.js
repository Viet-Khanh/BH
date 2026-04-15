import Payment from '../../../models/Payment.js';

export const findPayments = async (filter) => Payment.find(filter).lean();

export const findPaymentById = async (id) => Payment.findOne({ id }).lean();

export const createPayment = async (payload) => Payment.create(payload);

export const insertPayments = async (payload) =>
  Payment.insertMany(payload, { ordered: false });

export const upsertPayment = async (id, payload) =>
  Payment.findOneAndUpdate(
    { id },
    { $set: { ...payload, id } },
    { new: true, upsert: true }
  ).lean();

export const softDeletePayment = async (id, deletedAt) =>
  Payment.findOneAndUpdate(
    { id },
    { $set: { isDeleted: true, deletedAt } },
    { new: true }
  ).lean();
