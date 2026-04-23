import Product from '../../../models/Product.js';
import Purchase from '../../../models/Purchase.js';
import Invoice from '../../../models/Invoice.js';
import Payment from '../../../models/Payment.js';
import Settings from '../../../models/Settings.js';
import Customer from '../../../models/Customer.js';

export const findProducts = async (filter, options = {}) => {
  let query = Product.find(filter);
  if (options.sort) query = query.sort(options.sort);
  if (options.limit) query = query.limit(options.limit);
  return query.lean();
};

export const findPurchases = async (filter) => Purchase.find(filter).lean();

export const findInvoices = async (filter) => Invoice.find(filter).lean();

export const findPayments = async (filter) => Payment.find(filter).lean();

export const findMainSettings = async () =>
  Settings.findOne({ id: 'main' }).lean();

export const findCustomerById = async (id) => Customer.findOne({ id }).lean();
