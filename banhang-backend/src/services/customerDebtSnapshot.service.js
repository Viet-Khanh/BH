import Customer from '../models/Customer.js';
import Invoice from '../models/Invoice.js';
import Settings from '../models/Settings.js';
import { isSnapshotReady } from '../utils/snapshotStatus.js';

const CUSTOMER_PAYMENT_TYPES = new Set(['invoice_payment', 'debt_receipt']);

export const normalizeDebtDeltas = (deltas = []) => {
  const map = {};
  deltas.forEach((item) => {
    if (!item?.customerId) return;
    const delta = Number(item.delta || 0);
    if (!Number.isFinite(delta) || delta === 0) return;
    map[item.customerId] = (map[item.customerId] || 0) + delta;
  });
  return Object.entries(map)
    .filter(([, delta]) => delta !== 0)
    .map(([customerId, delta]) => ({ customerId, delta }));
};

export const invertDebtDeltas = (deltas = []) =>
  normalizeDebtDeltas(
    deltas.map((item) => ({
      customerId: item.customerId,
      delta: -Number(item.delta || 0),
    }))
  );

export const buildInvoiceDebtDelta = (invoice, multiplier = 1) => {
  if (!invoice?.customerId) return [];
  return [
    {
      customerId: invoice.customerId,
      delta: Number(invoice.total || 0) * multiplier,
    },
  ];
};

export const isCustomerPayment = (payment = {}) => {
  if (payment.supplierId || payment.purchaseId) return false;
  if (payment.paymentType)
    return CUSTOMER_PAYMENT_TYPES.has(payment.paymentType);
  return Boolean(payment.invoiceId || payment.customerId);
};

export const hydratePaymentCustomer = async (payment = {}) => {
  if (payment.customerId || !payment.invoiceId) return payment;
  const invoice = await Invoice.findOne({ id: payment.invoiceId }).lean();
  return { ...payment, customerId: invoice?.customerId || '' };
};

export const buildPaymentDebtDelta = (payment = {}, multiplier = 1) => {
  if (!isCustomerPayment(payment) || !payment.customerId) return [];
  return [
    {
      customerId: payment.customerId,
      delta: -Number(payment.amount || 0) * multiplier,
    },
  ];
};

const getMainSettings = () => Settings.findOne({ id: 'main' }).lean();

export const applyCustomerDebtDeltas = async (rawDeltas = [], options = {}) => {
  const deltas = normalizeDebtDeltas(rawDeltas);
  if (!deltas.length) return { applied: false, deltas: [] };

  const settings = options.settings || (await getMainSettings());
  if (!options.force && !isSnapshotReady(settings)) {
    return { applied: false, deltas: [] };
  }

  const now = new Date().toISOString();
  const operations = deltas.map(({ customerId, delta }) => ({
    updateOne: {
      filter: { id: customerId },
      update: { $inc: { currentDebt: delta }, $set: { debtUpdatedAt: now } },
    },
  }));

  await Customer.bulkWrite(operations, { ordered: true });
  return { applied: true, deltas };
};
