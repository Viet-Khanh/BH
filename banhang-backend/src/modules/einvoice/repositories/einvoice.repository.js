import Customer from '../../../models/Customer.js';
import Invoice from '../../../models/Invoice.js';
import Payment from '../../../models/Payment.js';
import Product from '../../../models/Product.js';
import Settings from '../../../models/Settings.js';

export const findMainSettings = () => Settings.findOne({ id: 'main' }).lean();

// Active invoices in range, plus deleted ones that were already exported
// (the shop has to adjust those on the provider website and keep the history).
export const findSalesInvoices = ({ from, to }) =>
  Invoice.find({
    date: { $gte: from, $lte: to },
    $or: [
      { isDeleted: { $ne: true } },
      { 'einvoice.exportedAt': { $nin: [null, ''] } },
    ],
  })
    .sort({ date: 1 })
    .lean();

export const findInvoicesByCodes = (codes) =>
  codes.length
    ? Invoice.find({
        code: { $in: codes },
        importBatchId: { $in: [null, ''] },
      }).lean()
    : [];

export const findInvoicesByIds = (ids) =>
  ids.length ? Invoice.find({ id: { $in: ids } }).lean() : [];

const findByIds = (Model, ids) =>
  ids.length ? Model.find({ id: { $in: ids } }).lean() : [];

export const findCustomersByIds = (ids) => findByIds(Customer, ids);

export const findProductsByIds = (ids) => findByIds(Product, ids);

export const findPaymentsByInvoiceIds = (invoiceIds) =>
  invoiceIds.length
    ? Payment.find({
        invoiceId: { $in: invoiceIds },
        isDeleted: { $ne: true },
      }).lean()
    : [];

export const updateEinvoiceFields = (invoiceIds, fields) =>
  Invoice.updateMany({ id: { $in: invoiceIds } }, { $set: fields });

// `fields` uses dotted paths, e.g. { 'einvoice.number': '0000123' }.
export const setInvoiceEinvoiceFields = (invoiceId, fields) =>
  Invoice.findOneAndUpdate(
    { id: invoiceId },
    { $set: fields },
    { new: true }
  ).lean();
