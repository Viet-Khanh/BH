import Customer from '../../../models/Customer.js';
import Invoice from '../../../models/Invoice.js';
import Payment from '../../../models/Payment.js';
import Product from '../../../models/Product.js';
import Purchase from '../../../models/Purchase.js';
import Settings from '../../../models/Settings.js';

const activeFilter = { isDeleted: { $ne: true } };

export const findActiveCustomers = () => Customer.find(activeFilter).lean();

export const findActiveInvoices = () => Invoice.find(activeFilter).lean();

export const findActivePayments = () => Payment.find(activeFilter).lean();

export const findActivePaymentsByInvoiceIds = (invoiceIds = []) => {
  if (!invoiceIds.length) return Promise.resolve([]);
  return Payment.find({
    ...activeFilter,
    invoiceId: { $in: invoiceIds },
  }).lean();
};

export const findActiveProducts = () => Product.find(activeFilter).lean();

export const findActivePurchases = () => Purchase.find(activeFilter).lean();

export const findMainSettings = () => Settings.findOne({ id: 'main' }).lean();

export const findDebtorCustomers = () =>
  Customer.find({
    ...activeFilter,
    currentDebt: { $gt: 0 },
  })
    .sort({ currentDebt: -1, name: 1 })
    .lean();

export const findLowStockProducts = (threshold) =>
  Product.find({
    ...activeFilter,
    stock: { $lte: threshold },
  })
    .sort({ stock: 1, name: 1 })
    .lean();
