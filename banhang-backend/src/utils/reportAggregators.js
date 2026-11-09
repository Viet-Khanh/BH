import Customer from '../models/Customer.js';
import Purchase from '../models/Purchase.js';
import Invoice from '../models/Invoice.js';
import Payment from '../models/Payment.js';
import Product from '../models/Product.js';
import { computeStock } from './stock.js';
import {
  buildOldDebtByInvoiceOrder,
  buildPaymentsByInvoice,
} from './customerDebt.js';
import {
  buildProductMap,
  buildInvoiceItems,
  buildInvoiceFinancials,
  buildCustomerMap,
  inRange,
} from './reportHelpers.js';

/**
 * Aggregator cho danh sách hóa đơn (Dùng chung cho getSalesInvoicesReport & getSalesDetailsReport)
 */
export const aggregateSalesInvoices = async ({ from, to, customerId }) => {
  const customers = await Customer.find({}).lean();
  const customerMap = buildCustomerMap(customers);
  const activeCustomers = customers.filter((customer) => !customer.isDeleted);

  const invoiceFilter = { isDeleted: { $ne: true } };
  if (customerId) invoiceFilter.customerId = customerId;
  const invoices = await Invoice.find(invoiceFilter).lean();
  const filteredInvoices = invoices.filter((invoice) =>
    inRange(invoice.date, from, to)
  );

  const invoiceIds = invoices.map((invoice) => invoice.id);
  const paymentFilter = { isDeleted: { $ne: true } };
  const paymentOr = [];
  if (invoiceIds.length) {
    paymentOr.push({ invoiceId: { $in: invoiceIds } });
  }
  paymentOr.push({ paymentType: 'debt_receipt' });
  paymentFilter.$or = paymentOr;

  const payments = await Payment.find(paymentFilter).lean();
  const paymentsByInvoice = buildPaymentsByInvoice(payments);
  const oldDebtByInvoice = buildOldDebtByInvoiceOrder({ invoices, payments });

  const productIds = new Set();
  invoices.forEach((invoice) => {
    (invoice.items || []).forEach((item) => {
      if (item.productId) productIds.add(item.productId);
    });
  });

  const products = productIds.size
    ? await Product.find({
        id: { $in: [...productIds] },
      }).lean()
    : [];
  const productMap = buildProductMap(products);

  return {
    filteredInvoices,
    customerMap,
    activeCustomers,
    paymentsByInvoice,
    oldDebtByInvoice,
    productMap,
  };
};

/**
 * Aggregator cho chi tiết một hóa đơn (Dùng chung cho Preview và Detail)
 */
export const aggregateSingleInvoice = async (invoice) => {
  const [customer, payments, purchases, allInvoices] = await Promise.all([
    Customer.findOne({
      id: invoice.customerId,
      isDeleted: { $ne: true },
    }).lean(),
    Payment.find({ invoiceId: invoice.id, isDeleted: { $ne: true } }).lean(),
    Purchase.find({ isDeleted: { $ne: true } }).lean(),
    Invoice.find({ isDeleted: { $ne: true } }).lean(),
  ]);

  if (!customer && invoice.customerId) {
    // In case customer was deleted but we still want to show name (Preview handles it by generic search without isDeleted sometimes, but let's fallback)
    // Actually standard logic fetches customer with isDeleted condition or without.
  }

  const fallbackCustomer = await Customer.findOne({
    id: invoice.customerId,
  }).lean();
  const finalCustomer = customer || fallbackCustomer;

  const productIds = new Set();
  (invoice.items || []).forEach((item) => {
    if (item.productId) productIds.add(item.productId);
  });

  const baseProducts = productIds.size
    ? await Product.find({
        id: { $in: [...productIds] },
      }).lean()
    : [];
  const products = baseProducts.map((product) => ({
    ...product,
    stock: computeStock(product.id, purchases, allInvoices, baseProducts),
  }));
  const productMap = buildProductMap(products);

  const customerInvoices = allInvoices.filter(
    (item) => item.customerId === invoice.customerId
  );
  const customerInvoiceIds = customerInvoices.map((item) => item.id);
  const customerPaymentFilter = {
    isDeleted: { $ne: true },
    $or: [
      ...(customerInvoiceIds.length
        ? [{ invoiceId: { $in: customerInvoiceIds } }]
        : []),
      { customerId: invoice.customerId, paymentType: 'debt_receipt' },
    ],
  };

  const customerPayments = await Payment.find(customerPaymentFilter).lean();
  const paymentsByInvoice = buildPaymentsByInvoice(customerPayments);
  const oldDebtByInvoice = buildOldDebtByInvoiceOrder({
    invoices: customerInvoices,
    payments: customerPayments,
  });

  const financials = buildInvoiceFinancials(
    invoice,
    oldDebtByInvoice,
    paymentsByInvoice
  );

  return {
    invoice: {
      ...invoice,
      customerDebt: financials.oldDebt,
      ...financials,
    },
    customer: finalCustomer,
    payments,
    products,
    items: buildInvoiceItems(invoice, productMap),
  };
};
