import Product from '../../../models/Product.js';
import Purchase from '../../../models/Purchase.js';
import Supplier from '../../../models/Supplier.js';
import Invoice from '../../../models/Invoice.js';
import Payment from '../../../models/Payment.js';

export const findPurchases = async (filter, options = {}) => {
  let query = Purchase.find(filter);
  if (options.sort) query = query.sort(options.sort);
  if (options.limit) query = query.limit(options.limit);
  return query.lean();
};

export const findPurchaseById = async (id) =>
  Purchase.findOne({ id, isDeleted: { $ne: true } }).lean();

export const findSupplierById = async (id) =>
  Supplier.findOne({ id, isDeleted: { $ne: true } }).lean();

export const findSuppliersByIds = async (ids) =>
  Supplier.find({ id: { $in: ids } }).lean();

export const findProductsByIds = async (ids, { activeOnly = false } = {}) =>
  Product.find({
    id: { $in: ids },
    ...(activeOnly ? { isDeleted: { $ne: true } } : {}),
  }).lean();

export const findInvoices = async (filter) => Invoice.find(filter).lean();

export const findPayments = async (filter) => Payment.find(filter).lean();

export const createPurchaseDoc = async (payload) => Purchase.create(payload);

export const updatePurchaseDoc = async (id, fields) =>
  Purchase.findOneAndUpdate(
    { id, isDeleted: { $ne: true } },
    { $set: fields },
    { new: true }
  ).lean();

export const updateProductById = async (id, fields) =>
  Product.findOneAndUpdate({ id }, { $set: fields }, { new: true }).lean();
