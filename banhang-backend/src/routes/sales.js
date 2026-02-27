import express from 'express';
import Product from '../models/Product.js';
import Invoice from '../models/Invoice.js';
import Payment from '../models/Payment.js';

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
    const products = await Product.find(filter).sort({ name: 1 }).limit(limit).lean();
    res.json(products);
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
    const invoiceFilter = { customerId, isDeleted: { $ne: true } };
    if (excludeInvoiceId) invoiceFilter.id = { $ne: excludeInvoiceId };

    const invoices = await Invoice.find(invoiceFilter).lean();
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
