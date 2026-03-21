import express from 'express';
import Product from '../models/Product.js';
import Purchase from '../models/Purchase.js';
import Invoice from '../models/Invoice.js';
import Payment from '../models/Payment.js';
import { computeStock } from '../utils/stock.js';
import {
  buildPaymentsByInvoice,
  computeCustomerDebtBeforeDate,
} from '../utils/customerDebt.js';

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
    const asOfDate = String(req.query.asOfDate || '').trim();

    const invoices = await Invoice.find({ customerId, isDeleted: { $ne: true } }).lean();
    const invoiceIds = invoices.map((inv) => inv.id);
    const paymentFilter = {
      isDeleted: { $ne: true },
      $or: [
        ...(invoiceIds.length ? [{ invoiceId: { $in: invoiceIds } }] : []),
        { customerId, paymentType: 'debt_receipt' },
      ],
    };
    const payments = await Payment.find(paymentFilter).lean();

    if (excludeInvoiceId || asOfDate) {
      const targetInvoice = excludeInvoiceId
        ? invoices.find((invoice) => invoice.id === excludeInvoiceId) || null
        : null;
      const effectiveExcludeInvoiceId =
        targetInvoice?.customerId === customerId ? excludeInvoiceId : '';
      const effectiveAsOfDate = asOfDate || targetInvoice?.date || '';

      if (effectiveAsOfDate) {
        const debt = computeCustomerDebtBeforeDate({
          invoices,
          payments,
          customerId,
          asOfDate: effectiveAsOfDate,
          excludeInvoiceId: effectiveExcludeInvoiceId,
        });
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

    const invoicePayments = payments.filter(
      (payment) => payment.invoiceId && payment.paymentType !== 'debt_receipt'
    );
    const debtReceipts = payments.filter((payment) => payment.paymentType === 'debt_receipt');
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
