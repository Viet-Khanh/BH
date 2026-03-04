import express from 'express';
import Product from '../models/Product.js';
import Purchase from '../models/Purchase.js';
import Invoice from '../models/Invoice.js';
import Payment from '../models/Payment.js';
import { computeStock } from '../utils/stock.js';

const router = express.Router();

const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const buildProductSearchFilter = (search) => {
  const trimmed = String(search || '').trim();
  if (!trimmed) return {};
  const terms = trimmed.split(/\s+/).filter(Boolean);
  if (!terms.length) return {};
  const buildOr = (regex) => [
    { name: regex },
    { code: regex },
    { group: regex },
    { unit: regex },
    { spec: regex },
  ];
  return {
    $and: terms.map((term) => {
      const regex = new RegExp(escapeRegex(term), 'i');
      return { $or: buildOr(regex) };
    }),
  };
};

const buildPaymentsByInvoice = (payments = []) => {
  const map = {};
  payments.forEach((payment) => {
    if (!payment.invoiceId) return;
    if (payment.paymentType === 'debt_receipt') return;
    map[payment.invoiceId] = (map[payment.invoiceId] || 0) + Number(payment.amount || 0);
  });
  return map;
};

const buildOldDebtByInvoice = (invoices = [], paymentsByInvoice = {}) => {
  const sorted = [...invoices].sort((a, b) => new Date(a.date) - new Date(b.date));
  const customerDebt = {};
  const map = {};
  sorted.forEach((invoice) => {
    const paid = paymentsByInvoice[invoice.id] || 0;
    const total = Number(invoice.total || 0);
    map[invoice.id] = customerDebt[invoice.customerId] || 0;
    customerDebt[invoice.customerId] = (customerDebt[invoice.customerId] || 0) + total - paid;
  });
  return map;
};

router.get(
  '/products',
  asyncHandler(async (req, res) => {
    const rawLimit = Number(req.query.limit || 30);
    const limit = Number.isFinite(rawLimit) ? Math.min(Math.max(rawLimit, 1), 200) : 30;
    const searchFilter = buildProductSearchFilter(req.query.search);
    const filter = {
      isDeleted: { $ne: true },
      ...searchFilter,
    };
    const [products, purchases, invoices] = await Promise.all([
      Product.find(filter).sort({ name: 1 }).limit(limit).lean(),
      Purchase.find({ isDeleted: { $ne: true } }).lean(),
      Invoice.find({ isDeleted: { $ne: true } }).lean(),
    ]);

    const rows = products.map((product) => ({
      ...product,
      stock: computeStock(product.id, purchases, invoices, products),
    }));

    res.json(rows);
  })
);

router.get(
  '/customer-debt',
  asyncHandler(async (req, res) => {
    const customerId = String(req.query.customerId || '').trim();
    if (!customerId) {
      res.status(400).json({ message: 'customerId is required' });
      return;
    }
    const excludeInvoiceId = String(req.query.excludeInvoiceId || '').trim();

    if (excludeInvoiceId) {
      const targetInvoice = await Invoice.findOne({
        id: excludeInvoiceId,
        isDeleted: { $ne: true },
      }).lean();
      if (targetInvoice?.customerId === customerId) {
        const invoices = await Invoice.find({ customerId, isDeleted: { $ne: true } }).lean();
        const invoiceIds = invoices.map((inv) => inv.id);
        const invoicePayments = invoiceIds.length
          ? await Payment.find({ invoiceId: { $in: invoiceIds }, isDeleted: { $ne: true } }).lean()
          : [];
        const paymentsByInvoice = buildPaymentsByInvoice(invoicePayments);
        const oldDebtByInvoice = buildOldDebtByInvoice(invoices, paymentsByInvoice);
        const debt = Number(oldDebtByInvoice[excludeInvoiceId] || 0);
        res.json({
          customerId,
          total: debt,
          paid: 0,
          invoicePaid: 0,
          debtReceiptPaid: 0,
          debt,
        });
        return;
      }
    }

    const invoices = await Invoice.find({ customerId, isDeleted: { $ne: true } }).lean();
    const invoiceIds = invoices.map((inv) => inv.id);
    const [invoicePayments, debtReceipts] = await Promise.all([
      invoiceIds.length
        ? Payment.find({ invoiceId: { $in: invoiceIds }, isDeleted: { $ne: true } }).lean()
        : Promise.resolve([]),
      Payment.find({
        customerId,
        paymentType: 'debt_receipt',
        isDeleted: { $ne: true },
      }).lean(),
    ]);
    const total = invoices.reduce((sum, inv) => sum + Number(inv.total || 0), 0);
    const invoicePaid = invoicePayments.reduce((sum, payment) => sum + Number(payment.amount || 0), 0);
    const debtReceiptPaid = debtReceipts.reduce(
      (sum, payment) => sum + Number(payment.amount || 0),
      0
    );
    const paid = invoicePaid + debtReceiptPaid;

    res.json({
      customerId,
      total,
      paid,
      invoicePaid,
      debtReceiptPaid,
      debt: total - paid,
    });
  })
);

export default router;
