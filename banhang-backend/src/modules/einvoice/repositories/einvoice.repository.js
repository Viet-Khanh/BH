import Customer from '../../../models/Customer.js';
import Invoice from '../../../models/Invoice.js';
import Payment from '../../../models/Payment.js';
import Product from '../../../models/Product.js';
import Settings from '../../../models/Settings.js';

export const findMainSettings = () => Settings.findOne({ id: 'main' }).lean();

// Active invoices in range, plus deleted ones that were already exported
// (the shop still has to cancel/adjust those on the provider website).
export const findSalesInvoices = ({ from, to }) =>
  Invoice.find({
    date: { $gte: from, $lte: to },
    $or: [
      { isDeleted: { $ne: true } },
      { 'einvoice.changedAfterExport': true },
    ],
  })
    .sort({ date: 1 })
    .lean();

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

export const setEinvoiceNumber = (invoiceId, number) =>
  Invoice.findOneAndUpdate(
    { id: invoiceId },
    { $set: { 'einvoice.number': number } },
    { new: true }
  ).lean();
