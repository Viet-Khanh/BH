import Product from '../../../models/Product.js';
import Purchase from '../../../models/Purchase.js';
import Invoice from '../../../models/Invoice.js';
import Payment from '../../../models/Payment.js';

export const findProducts = async (filter, options = {}) => {
  let query = Product.find(filter);
  if (options.sort) query = query.sort(options.sort);
  if (options.limit) query = query.limit(options.limit);
  return query.lean();
};

export const findPurchases = async (filter) => Purchase.find(filter).lean();

export const findInvoices = async (filter) => Invoice.find(filter).lean();

export const findPayments = async (filter) => Payment.find(filter).lean();
