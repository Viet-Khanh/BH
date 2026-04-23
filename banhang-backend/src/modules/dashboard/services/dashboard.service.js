import dayjs from 'dayjs';
import { computeStock } from '../../../utils/stock.js';
import { isSnapshotReady } from '../../../utils/snapshotStatus.js';
import * as DashboardRepository from '../repositories/dashboard.repository.js';

const isActive = (item) => item && item.isDeleted !== true;

const sumAmounts = (items = []) =>
  items.reduce((sum, item) => sum + Number(item.amount || 0), 0);

const getTodayRange = (now = new Date()) => {
  const current = dayjs(now);
  return {
    start: current.startOf('day'),
    end: current.endOf('day'),
  };
};

const isInDayRange = (dateValue, range) => {
  const date = dayjs(dateValue);
  if (!date.isValid()) return false;
  const time = date.valueOf();
  return time >= range.start.valueOf() && time <= range.end.valueOf();
};

const buildSalesToday = ({ invoices, payments, range }) => {
  const todayInvoices = invoices.filter((invoice) =>
    isInDayRange(invoice.date, range)
  );
  const todayInvoiceIds = new Set(todayInvoices.map((invoice) => invoice.id));
  const invoicePayments = payments.filter(
    (payment) =>
      todayInvoiceIds.has(payment.invoiceId) &&
      payment.paymentType !== 'debt_receipt'
  );
  const amount = todayInvoices.reduce(
    (sum, invoice) => sum + Number(invoice.total || 0),
    0
  );
  const paid = sumAmounts(invoicePayments);

  return {
    invoiceCount: todayInvoices.length,
    amount,
    paid,
    remain: amount - paid,
  };
};

const buildSalesTodayFromInvoices = ({ invoices, payments }) => {
  const invoiceIds = new Set(invoices.map((invoice) => invoice.id));
  const invoicePayments = payments.filter(
    (payment) =>
      invoiceIds.has(payment.invoiceId) &&
      payment.paymentType !== 'debt_receipt'
  );
  const amount = invoices.reduce(
    (sum, invoice) => sum + Number(invoice.total || 0),
    0
  );
  const paid = sumAmounts(invoicePayments);
  return {
    invoiceCount: invoices.length,
    amount,
    paid,
    remain: amount - paid,
  };
};

const buildDebtSummary = ({ customers, invoices, payments }) => {
  const paymentsByInvoice = payments.reduce((map, payment) => {
    if (!payment.invoiceId || payment.paymentType === 'debt_receipt')
      return map;
    map[payment.invoiceId] =
      (map[payment.invoiceId] || 0) + Number(payment.amount || 0);
    return map;
  }, {});
  const debtReceiptsByCustomer = payments.reduce((map, payment) => {
    if (!payment.customerId || payment.paymentType !== 'debt_receipt')
      return map;
    map[payment.customerId] =
      (map[payment.customerId] || 0) + Number(payment.amount || 0);
    return map;
  }, {});

  const debtRows = customers
    .map((customer) => {
      const customerInvoices = invoices.filter(
        (invoice) => invoice.customerId === customer.id
      );
      const total = customerInvoices.reduce(
        (sum, invoice) => sum + Number(invoice.total || 0),
        0
      );
      const invoicePaid = customerInvoices.reduce(
        (sum, invoice) => sum + Number(paymentsByInvoice[invoice.id] || 0),
        0
      );
      const debt =
        total - invoicePaid - Number(debtReceiptsByCustomer[customer.id] || 0);
      return { customer, debt };
    })
    .filter((row) => row.debt > 0);

  const totalDebt = debtRows.reduce((sum, row) => sum + row.debt, 0);
  const topCustomers = debtRows
    .sort((left, right) => right.debt - left.debt)
    .slice(0, 5)
    .map(({ customer, debt }) => ({
      customerId: customer.id,
      name: customer.name || '',
      phone: customer.phone || '',
      debt,
    }));

  return {
    totalDebt,
    debtorCount: debtRows.length,
    topCustomers,
  };
};

const buildStockSummary = ({ products, purchases, invoices, settings }) => {
  const rawThreshold = Number(settings?.lowStockThreshold ?? 0);
  const threshold = Number.isFinite(rawThreshold) ? rawThreshold : 0;
  const lowRows = products
    .map((product) => ({
      product,
      stock: computeStock(product.id, purchases, invoices, products),
    }))
    .filter((row) => row.stock <= threshold);

  const topProducts = lowRows
    .sort(
      (left, right) =>
        left.stock - right.stock ||
        String(left.product.name || '').localeCompare(right.product.name || '')
    )
    .slice(0, 5)
    .map(({ product, stock }) => ({
      productId: product.id,
      code: product.code || '',
      name: product.name || '',
      unit: product.unit || '',
      stock,
    }));

  return {
    lowStockCount: lowRows.length,
    threshold,
    topProducts,
  };
};

const buildSnapshotDebtSummary = (customers = []) => {
  const debtRows = customers
    .map((customer) => ({
      customer,
      debt: Number(customer.currentDebt || 0),
    }))
    .filter((row) => row.debt > 0)
    .sort(
      (left, right) =>
        right.debt - left.debt ||
        String(left.customer.name || '').localeCompare(
          right.customer.name || ''
        )
    );
  return {
    totalDebt: debtRows.reduce((sum, row) => sum + row.debt, 0),
    debtorCount: debtRows.length,
    topCustomers: debtRows.slice(0, 5).map(({ customer, debt }) => ({
      customerId: customer.id,
      name: customer.name || '',
      phone: customer.phone || '',
      debt,
    })),
  };
};

const buildSnapshotStockSummary = ({ products = [], threshold }) => {
  const lowRows = products
    .map((product) => ({
      product,
      stock: Number(product.stock ?? product.openingStock ?? 0),
    }))
    .sort(
      (left, right) =>
        left.stock - right.stock ||
        String(left.product.name || '').localeCompare(right.product.name || '')
    );
  return {
    lowStockCount: lowRows.length,
    threshold,
    topProducts: lowRows.slice(0, 5).map(({ product, stock }) => ({
      productId: product.id,
      code: product.code || '',
      name: product.name || '',
      unit: product.unit || '',
      stock,
    })),
  };
};

export const getTodayDashboard = async (options = {}, deps = {}) => {
  const repository = deps.repository || DashboardRepository;
  const now = options.now?.() || new Date();
  const range = getTodayRange(now);
  const settings = await repository.findMainSettings();
  const invoicesForToday = await repository.findActiveInvoices();
  const todayInvoices = invoicesForToday.filter((invoice) =>
    isInDayRange(invoice.date, range)
  );
  const todayInvoiceIds = todayInvoices.map((invoice) => invoice.id);
  const todayPayments = repository.findActivePaymentsByInvoiceIds
    ? await repository.findActivePaymentsByInvoiceIds(todayInvoiceIds)
    : (await repository.findActivePayments()).filter((payment) =>
        todayInvoiceIds.includes(payment.invoiceId)
      );

  if (isSnapshotReady(settings)) {
    const rawThreshold = Number(settings?.lowStockThreshold ?? 0);
    const threshold = Number.isFinite(rawThreshold) ? rawThreshold : 0;
    const [debtCustomers, lowStockProducts] = await Promise.all([
      repository.findDebtorCustomers(),
      repository.findLowStockProducts(threshold),
    ]);
    return {
      salesToday: buildSalesTodayFromInvoices({
        invoices: todayInvoices.filter(isActive),
        payments: todayPayments.filter(isActive),
      }),
      debt: buildSnapshotDebtSummary(debtCustomers.filter(isActive)),
      stock: buildSnapshotStockSummary({
        products: lowStockProducts.filter(isActive),
        threshold,
      }),
      generatedAt: dayjs(now).toISOString(),
    };
  }

  const [customers, invoices, payments, products, purchases] =
    await Promise.all([
      repository.findActiveCustomers(),
      repository.findActiveInvoices(),
      repository.findActivePayments(),
      repository.findActiveProducts(),
      repository.findActivePurchases(),
    ]);

  const activeCustomers = customers.filter(isActive);
  const activeInvoices = invoices.filter(isActive);
  const activePayments = payments.filter(isActive);
  const activeProducts = products.filter(isActive);
  const activePurchases = purchases.filter(isActive);

  return {
    salesToday: buildSalesToday({
      invoices: activeInvoices,
      payments: activePayments,
      range,
    }),
    debt: buildDebtSummary({
      customers: activeCustomers,
      invoices: activeInvoices,
      payments: activePayments,
    }),
    stock: buildStockSummary({
      products: activeProducts,
      purchases: activePurchases,
      invoices: activeInvoices,
      settings,
    }),
    generatedAt: dayjs(now).toISOString(),
  };
};
