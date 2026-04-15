import Product from '../../../models/Product.js';
import Customer from '../../../models/Customer.js';
import Supplier from '../../../models/Supplier.js';
import Purchase from '../../../models/Purchase.js';
import Invoice from '../../../models/Invoice.js';
import Payment from '../../../models/Payment.js';
import Cashbook from '../../../models/Cashbook.js';
import Settings from '../../../models/Settings.js';

export const findProducts = (filter = {}) => Product.find(filter).lean();

export const findCustomers = (filter = {}) => Customer.find(filter).lean();

export const findSuppliers = (filter = {}) => Supplier.find(filter).lean();

export const findPurchases = (filter = {}) => Purchase.find(filter).lean();

export const findInvoices = (filter = {}) => Invoice.find(filter).lean();

export const findPayments = (filter = {}) => Payment.find(filter).lean();

export const findCashbookEntries = (filter = {}) =>
  Cashbook.find(filter).lean();

export const findMainSettings = () => Settings.findOne({ id: 'main' }).lean();

export const findOneCustomer = (filter = {}) => Customer.findOne(filter).lean();

export const findOneSupplier = (filter = {}) => Supplier.findOne(filter).lean();

export const findOneInvoice = (filter = {}) => Invoice.findOne(filter).lean();

export const softDeleteInvoiceById = async (id, deletedAt) =>
  Invoice.findOneAndUpdate(
    { id },
    { $set: { isDeleted: true, deletedAt } },
    { new: true }
  ).lean();

export const softDeletePaymentsByInvoiceId = async (invoiceId, deletedAt) =>
  Payment.updateMany({ invoiceId }, { $set: { isDeleted: true, deletedAt } });
