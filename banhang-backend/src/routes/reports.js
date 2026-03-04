import express from 'express';
import dayjs from 'dayjs';
import Product from '../models/Product.js';
import Customer from '../models/Customer.js';
import Supplier from '../models/Supplier.js';
import Purchase from '../models/Purchase.js';
import Invoice from '../models/Invoice.js';
import Payment from '../models/Payment.js';
import Cashbook from '../models/Cashbook.js';
import Settings from '../models/Settings.js';
import { computeStock } from '../utils/stock.js';

const router = express.Router();

const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

const toStartOfDay = (value) => dayjs(value).startOf('day');
const toEndOfDay = (value) => dayjs(value).endOf('day');
const isValidDate = (value) => value && dayjs(value).isValid();

const parseRange = (query) => {
  const from = isValidDate(query.from) ? toStartOfDay(query.from) : null;
  const to = isValidDate(query.to) ? toEndOfDay(query.to) : null;
  return { from, to };
};

const parsePagination = (query = {}) => {
  const rawPage = Number(query.page || 1);
  const rawPageSize = Number(query.pageSize || 20);
  const page = Number.isFinite(rawPage) && rawPage > 0 ? Math.floor(rawPage) : 1;
  const pageSize =
    Number.isFinite(rawPageSize) && rawPageSize > 0
      ? Math.min(Math.floor(rawPageSize), 200)
      : 20;
  return { page, pageSize };
};

const inRange = (dateValue, from, to) => {
  if (!dateValue) return false;
  const target = dayjs(dateValue);
  if (from && target.isBefore(from)) return false;
  if (to && target.isAfter(to)) return false;
  return true;
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

const buildPaymentsByPurchase = (payments = []) => {
  const map = {};
  payments.forEach((payment) => {
    if (!payment.purchaseId) return;
    if (payment.paymentType === 'supplier_debt_payment') return;
    map[payment.purchaseId] = (map[payment.purchaseId] || 0) + Number(payment.amount || 0);
  });
  return map;
};

const buildSupplierDebtPaymentsBySupplier = (payments = []) => {
  const map = {};
  payments.forEach((payment) => {
    if (payment.paymentType !== 'supplier_debt_payment') return;
    if (!payment.supplierId) return;
    map[payment.supplierId] = (map[payment.supplierId] || 0) + Number(payment.amount || 0);
  });
  return map;
};

const buildDebtReceiptsByCustomer = (payments = []) => {
  const map = {};
  payments.forEach((payment) => {
    if (payment.paymentType !== 'debt_receipt') return;
    if (!payment.customerId) return;
    map[payment.customerId] = (map[payment.customerId] || 0) + Number(payment.amount || 0);
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

const buildCustomerMap = (customers = []) =>
  customers.reduce((acc, customer) => {
    acc[customer.id] = customer;
    return acc;
  }, {});

const buildProductMap = (products = []) =>
  products.reduce((acc, product) => {
    acc[product.id] = product;
    return acc;
  }, {});

const getAreaMultiplier = (item) => {
  const length = Number(item.length || 0);
  const width = Number(item.width || 0);
  return length > 0 && width > 0 ? length * width : 1;
};

const getInvoiceAmount = (invoice) => {
  if (invoice.total !== undefined && invoice.total !== null) {
    return Number(invoice.total || 0);
  }
  return (invoice.items || []).reduce((sum, item) => {
    const qty = Number(item.qty || 0);
    const unitPrice = Number(item.unitPrice || 0);
    const lineTotalValue = item.lineTotal ?? qty * unitPrice;
    const lineTotal = Number(lineTotalValue || 0);
    return sum + lineTotal;
  }, 0);
};

const buildInvoiceFinancials = (invoice, oldDebtByInvoice = {}, paymentsByInvoice = {}) => {
  const amount = getInvoiceAmount(invoice);
  const oldDebt = Number(oldDebtByInvoice[invoice.id] || 0);
  const paid = Number(paymentsByInvoice[invoice.id] || 0);
  const totalPay = amount + oldDebt;
  const remain = totalPay - paid;
  return { amount, oldDebt, totalPay, paid, remain };
};

const computeInvoiceCost = (invoice, productMap = {}) =>
  (invoice.items || []).reduce((sum, item) => {
    const qty = Number(item.qty || 0);
    const snapshotCost = item.costPriceSnapshot;
    const fallbackCost = productMap[item.productId]?.avgCost;
    const costUnit = Number(snapshotCost ?? fallbackCost ?? 0);
    const area = getAreaMultiplier(item);
    return sum + qty * costUnit * area;
  }, 0);

const buildInvoiceSummary = (
  invoice,
  { customerMap, productMap, paymentsByInvoice, oldDebtByInvoice }
) => {
  const items = invoice.items || [];
  const customer = customerMap[invoice.customerId];
  const { amount, oldDebt, totalPay, paid, remain } = buildInvoiceFinancials(
    invoice,
    oldDebtByInvoice,
    paymentsByInvoice
  );
  const itemsCount = items.length;
  const qtySum = items.reduce((sum, item) => sum + Number(item.qty || 0), 0);
  const cost = computeInvoiceCost(invoice, productMap);
  const profit = amount - cost;

  return {
    id: invoice.id,
    code: invoice.code,
    date: invoice.date,
    staff: invoice.staff || 'admin',
    itemsCount,
    qtySum,
    amount,
    oldDebt,
    totalPay,
    paid,
    remain,
    profit,
    customerName: customer?.name || '',
    phone: customer?.phone || '',
    address: customer?.address || '',
    note: invoice.note || '',
  };
};

const buildInvoiceItems = (invoice, productMap = {}) =>
  (invoice.items || []).map((item, index) => {
    const product = productMap[item.productId] || {};
    const qty = Number(item.qty || 0);
    const unitPrice = Number(item.unitPrice || 0);
    const lineTotalValue = item.lineTotal ?? qty * unitPrice;
    const lineTotal = Number(lineTotalValue || 0);
    const costUnit = Number(item.costPriceSnapshot ?? product.avgCost ?? 0);
    const area = getAreaMultiplier(item);
    const costTotal = qty * costUnit * area;
    const profit = lineTotal - costTotal;
    return {
      key: `${invoice.id}-${index}`,
      productId: item.productId,
      name: product.name || 'Sản phẩm',
      unit: product.unit || '',
      spec: product.spec || '',
      qty,
      unitPrice,
      lineTotal,
      costUnit,
      costTotal,
      profit,
      note: item.lineNote || '',
    };
  });

const buildProfitRows = (invoices = []) => {
  const map = {};
  invoices.forEach((invoice) => {
    const key = dayjs(invoice.date).format('YYYY-MM-DD');
    if (!map[key]) {
      map[key] = { date: key, revenue: 0, cost: 0, profit: 0 };
    }
    const revenue = Number(invoice.total || 0);
    const cost = (invoice.items || []).reduce((sum, item) => {
      const qty = Number(item.qty || 0);
      const unitCost = Number(item.costPriceSnapshot || 0);
      const length = Number(item.length || 0);
      const width = Number(item.width || 0);
      const area = length > 0 && width > 0 ? length * width : 1;
      return sum + qty * unitCost * area;
    }, 0);
    map[key].revenue += revenue;
    map[key].cost += cost;
    map[key].profit += revenue - cost;
  });

  return Object.values(map).sort((a, b) => (a.date > b.date ? 1 : -1));
};

router.get(
  '/stock',
  asyncHandler(async (req, res) => {
    const [products, purchases, invoices, settings] = await Promise.all([
      Product.find({ isDeleted: { $ne: true } }).lean(),
      Purchase.find({ isDeleted: { $ne: true } }).lean(),
      Invoice.find({ isDeleted: { $ne: true } }).lean(),
      Settings.findOne({ id: 'main' }).lean(),
    ]);

    const rows = products.map((product) => {
      const stock = computeStock(product.id, purchases, invoices, products);
      return {
        id: product.id,
        name: product.name,
        group: product.group,
        unit: product.unit,
        code: product.code,
        stock,
        openingStock: Number(product.openingStock || 0),
        avgCost: product.avgCost || 0,
        value: stock * Number(product.avgCost || 0),
      };
    });

    res.json({
      rows,
      lowStockThreshold: settings?.lowStockThreshold ?? 0,
    });
  })
);

router.get(
  '/stock-movement',
  asyncHandler(async (req, res) => {
    const { from, to } = parseRange(req.query);
    const hasFrom = !!from;

    const [products, purchases, invoices] = await Promise.all([
      Product.find({ isDeleted: { $ne: true } }).lean(),
      Purchase.find({ isDeleted: { $ne: true } }).lean(),
      Invoice.find({ isDeleted: { $ne: true } }).lean(),
    ]);

    const statsByProduct = {};
    const getStats = (productId) => {
      if (!statsByProduct[productId]) {
        statsByProduct[productId] = {
          appliedPurchaseTotal: 0,
          purchaseBeforeFrom: 0,
          purchaseRange: 0,
          invoiceBeforeFrom: 0,
          invoiceRange: 0,
        };
      }
      return statsByProduct[productId];
    };

    purchases.forEach((purchase) => {
      const purchaseDate = purchase.date;
      const beforeFrom = hasFrom && dayjs(purchaseDate).isBefore(from);
      const inRangeFlag = inRange(purchaseDate, from, to);

      (purchase.items || []).forEach((item) => {
        if (!item.productId) return;
        const stats = getStats(item.productId);
        const qty = Number(item.qty || 0);
        if (purchase.appliedToStock) {
          stats.appliedPurchaseTotal += qty;
        }
        if (beforeFrom) stats.purchaseBeforeFrom += qty;
        if (inRangeFlag) stats.purchaseRange += qty;
      });
    });

    invoices.forEach((invoice) => {
      const invoiceDate = invoice.date;
      const beforeFrom = hasFrom && dayjs(invoiceDate).isBefore(from);
      const inRangeFlag = inRange(invoiceDate, from, to);

      (invoice.items || []).forEach((item) => {
        if (!item.productId) return;
        const stats = getStats(item.productId);
        const qty = Number(item.qty || 0);
        if (beforeFrom) stats.invoiceBeforeFrom += qty;
        if (inRangeFlag) stats.invoiceRange += qty;
      });
    });

    const rows = products.map((product) => {
      const stats = statsByProduct[product.id] || {
        appliedPurchaseTotal: 0,
        purchaseBeforeFrom: 0,
        purchaseRange: 0,
        invoiceBeforeFrom: 0,
        invoiceRange: 0,
      };
      const baseStock = Number(product.openingStock || 0);
      const initialStock = baseStock - Number(stats.appliedPurchaseTotal || 0);
      const openingStock = hasFrom
        ? initialStock + Number(stats.purchaseBeforeFrom || 0) - Number(stats.invoiceBeforeFrom || 0)
        : initialStock;
      const inQty = Number(stats.purchaseRange || 0);
      const outQty = Number(stats.invoiceRange || 0);
      const closingStock = openingStock + inQty - outQty;

      return {
        id: product.id,
        name: product.name || '',
        unit: product.unit || '',
        openingStock,
        inQty,
        outQty,
        closingStock,
      };
    });

    res.json({ rows });
  })
);

router.get(
  '/debt',
  asyncHandler(async (req, res) => {
    const [customers, invoices, payments] = await Promise.all([
      Customer.find({ isDeleted: { $ne: true } }).lean(),
      Invoice.find({ isDeleted: { $ne: true } }).lean(),
      Payment.find({ isDeleted: { $ne: true } }).lean(),
    ]);

    const paymentsByInvoice = buildPaymentsByInvoice(payments);
    const debtReceiptsByCustomer = buildDebtReceiptsByCustomer(payments);
    const rows = customers.map((customer) => {
      const customerInvoices = invoices.filter((inv) => inv.customerId === customer.id);
      const total = customerInvoices.reduce((sum, inv) => sum + Number(inv.total || 0), 0);
      const invoicePaid = customerInvoices.reduce((sum, inv) => {
        const invoicePaidValue = paymentsByInvoice[inv.id] || 0;
        return sum + Number(invoicePaidValue || 0);
      }, 0);
      const debtReceiptPaid = Number(debtReceiptsByCustomer[customer.id] || 0);
      const paid = invoicePaid + debtReceiptPaid;
      const debt = total - paid;
      return {
        customer: {
          id: customer.id,
          name: customer.name,
          phone: customer.phone,
          address: customer.address,
        },
        total,
        invoicePaid,
        debtReceiptPaid,
        paid,
        debt,
      };
    });

    res.json({ rows });
  })
);

router.get(
  '/supplier-debt',
  asyncHandler(async (req, res) => {
    const [suppliers, purchases, payments] = await Promise.all([
      Supplier.find({ isDeleted: { $ne: true } }).lean(),
      Purchase.find({ isDeleted: { $ne: true } }).lean(),
      Payment.find({
        isDeleted: { $ne: true },
        $or: [{ purchaseId: { $ne: null } }, { paymentType: 'supplier_debt_payment' }],
      }).lean(),
    ]);

    const paymentsByPurchase = buildPaymentsByPurchase(payments);
    const debtPaymentsBySupplier = buildSupplierDebtPaymentsBySupplier(payments);
    const purchaseMap = purchases.reduce((acc, purchase) => {
      if (!purchase.supplierId) return acc;
      if (!acc[purchase.supplierId]) acc[purchase.supplierId] = [];
      acc[purchase.supplierId].push(purchase);
      return acc;
    }, {});

    const rows = suppliers.map((supplier) => {
      const supplierPurchases = purchaseMap[supplier.id] || [];
      const total = supplierPurchases.reduce((sum, purchase) => sum + Number(purchase.total || 0), 0);
      const purchasePaid = supplierPurchases.reduce(
        (sum, purchase) => sum + (paymentsByPurchase[purchase.id] || 0),
        0
      );
      const debtPaid = Number(debtPaymentsBySupplier[supplier.id] || 0);
      const paid = purchasePaid + debtPaid;
      return {
        supplier: {
          id: supplier.id,
          name: supplier.name,
          phone: supplier.phone,
          address: supplier.address,
        },
        total,
        purchasePaid,
        debtPaid,
        paid,
        debt: total - paid,
      };
    });

    res.json({ rows });
  })
);

router.get(
  '/supplier-debt/:supplierId',
  asyncHandler(async (req, res) => {
    const supplier = await Supplier.findOne({
      id: req.params.supplierId,
      isDeleted: { $ne: true },
    }).lean();
    if (!supplier) {
      res.status(404).json({ message: 'Supplier not found' });
      return;
    }

    const purchases = await Purchase.find({
      supplierId: supplier.id,
      isDeleted: { $ne: true },
    }).lean();
    const purchaseIds = purchases.map((purchase) => purchase.id);
    const [payments, supplierDebtPayments] = await Promise.all([
      purchaseIds.length
        ? Payment.find({ purchaseId: { $in: purchaseIds }, isDeleted: { $ne: true } }).lean()
        : Promise.resolve([]),
      Payment.find({
        supplierId: supplier.id,
        paymentType: 'supplier_debt_payment',
        isDeleted: { $ne: true },
      }).lean(),
    ]);
    const paymentsByPurchase = buildPaymentsByPurchase(payments);

    const openPurchases = purchases
      .map((purchase) => {
        const paid = paymentsByPurchase[purchase.id] || 0;
        const total = Number(purchase.total || 0);
        return {
          id: purchase.id,
          code: purchase.code,
          date: purchase.date,
          total,
          remain: total - paid,
        };
      })
      .filter((purchase) => purchase.remain > 0);

    const debtPaymentRows = supplierDebtPayments
      .map((payment) => ({
        id: payment.id,
        code: payment.code || '',
        date: payment.date,
        amount: Number(payment.amount || 0),
        method: payment.method || '',
        note: payment.note || '',
      }))
      .sort((a, b) => new Date(a.date) - new Date(b.date));

    const purchaseTotal = purchases.reduce((sum, purchase) => sum + Number(purchase.total || 0), 0);
    const purchasePaid = purchases.reduce(
      (sum, purchase) => sum + Number(paymentsByPurchase[purchase.id] || 0),
      0
    );
    const debtPaid = debtPaymentRows.reduce((sum, row) => sum + Number(row.amount || 0), 0);
    const totalPaid = purchasePaid + debtPaid;

    res.json({
      supplier: {
        id: supplier.id,
        name: supplier.name,
        phone: supplier.phone,
        address: supplier.address,
      },
      purchases: openPurchases,
      debtPayments: debtPaymentRows,
      summary: {
        purchaseTotal,
        purchasePaid,
        debtPaid,
        totalPaid,
        debt: purchaseTotal - totalPaid,
      },
    });
  })
);

router.get(
  '/debt/:customerId',
  asyncHandler(async (req, res) => {
    const customer = await Customer.findOne({
      id: req.params.customerId,
      isDeleted: { $ne: true },
    }).lean();
    if (!customer) {
      res.status(404).json({ message: 'Customer not found' });
      return;
    }

    const invoices = await Invoice.find({
      customerId: customer.id,
      isDeleted: { $ne: true },
    }).lean();
    const invoiceIds = invoices.map((inv) => inv.id);
    const [invoicePayments, debtReceipts] = await Promise.all([
      invoiceIds.length
        ? Payment.find({ invoiceId: { $in: invoiceIds }, isDeleted: { $ne: true } }).lean()
        : Promise.resolve([]),
      Payment.find({
        customerId: customer.id,
        paymentType: 'debt_receipt',
        isDeleted: { $ne: true },
      }).lean(),
    ]);

    const paymentsByInvoice = buildPaymentsByInvoice(invoicePayments);
    const openInvoices = invoices
      .map((inv) => {
        const paid = Number(paymentsByInvoice[inv.id] || 0);
        const total = Number(inv.total || 0);
        return {
          id: inv.id,
          code: inv.code,
          date: inv.date,
          total,
          remain: total - paid,
        };
      })
      .filter((inv) => inv.remain > 0);

    const debtReceiptRows = debtReceipts
      .map((payment) => ({
        id: payment.id,
        code: payment.code || '',
        date: payment.date,
        amount: Number(payment.amount || 0),
        method: payment.method || '',
        note: payment.note || '',
      }))
      .sort((a, b) => new Date(a.date) - new Date(b.date));

    const invoiceTotal = invoices.reduce((sum, inv) => sum + Number(inv.total || 0), 0);
    const invoicePaid = invoices.reduce((sum, inv) => sum + Number(paymentsByInvoice[inv.id] || 0), 0);
    const debtReceiptPaid = debtReceiptRows.reduce((sum, row) => sum + Number(row.amount || 0), 0);
    const totalPaid = invoicePaid + debtReceiptPaid;

    res.json({
      customer: {
        id: customer.id,
        name: customer.name,
        phone: customer.phone,
        address: customer.address,
      },
      invoices: openInvoices,
      debtReceipts: debtReceiptRows,
      summary: {
        invoiceTotal,
        invoicePaid,
        debtReceiptPaid,
        totalPaid,
        debt: invoiceTotal - totalPaid,
      },
    });
  })
);

router.get(
  '/sales-invoices',
  asyncHandler(async (req, res) => {
    const { from, to } = parseRange(req.query);
    const customerId = req.query.customerId || '';
    const { page, pageSize } = parsePagination(req.query);

    const customers = await Customer.find({}).lean();
    const customerMap = buildCustomerMap(customers);
    const activeCustomers = customers.filter((customer) => !customer.isDeleted);

    const invoiceFilter = { isDeleted: { $ne: true } };
    if (customerId) invoiceFilter.customerId = customerId;
    const invoices = await Invoice.find(invoiceFilter).lean();
    const filteredInvoices = invoices.filter((invoice) => inRange(invoice.date, from, to));

    const invoiceIds = invoices.map((invoice) => invoice.id);
    const payments = invoiceIds.length
      ? await Payment.find({ invoiceId: { $in: invoiceIds }, isDeleted: { $ne: true } }).lean()
      : [];
    const paymentsByInvoice = buildPaymentsByInvoice(payments);
    const oldDebtByInvoice = buildOldDebtByInvoice(invoices, paymentsByInvoice);

    const productIds = new Set();
    invoices.forEach((invoice) => {
      (invoice.items || []).forEach((item) => {
        if (item.productId) productIds.add(item.productId);
      });
    });
    const products = productIds.size
      ? await Product.find({ id: { $in: [...productIds] }, isDeleted: { $ne: true } }).lean()
      : [];
    const productMap = buildProductMap(products);

    const allRows = filteredInvoices
      .sort((a, b) => new Date(a.date) - new Date(b.date))
      .map((invoice) =>
        buildInvoiceSummary(invoice, {
          customerMap,
          productMap,
          paymentsByInvoice,
          oldDebtByInvoice,
        })
      );

    const summary = allRows.reduce(
      (acc, row) => ({
        amount: acc.amount + Number(row.amount || 0),
        paid: acc.paid + Number(row.paid || 0),
        remain: acc.remain + Number(row.remain || 0),
        profit: acc.profit + Number(row.profit || 0),
      }),
      {
        amount: 0,
        paid: 0,
        remain: 0,
        profit: 0,
      }
    );
    const total = allRows.length;
    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    const currentPage = Math.min(page, totalPages);
    const start = (currentPage - 1) * pageSize;
    const rows = allRows.slice(start, start + pageSize);

    res.json({
      rows,
      summary,
      customers: activeCustomers.map((customer) => ({ id: customer.id, name: customer.name })),
      pagination: {
        total,
        page: currentPage,
        pageSize,
        totalPages,
      },
    });
  })
);

router.get(
  '/sales-details',
  asyncHandler(async (req, res) => {
    const { from, to } = parseRange(req.query);
    const customerId = req.query.customerId || '';
    const { page, pageSize } = parsePagination(req.query);

    const customers = await Customer.find({}).lean();
    const customerMap = buildCustomerMap(customers);
    const activeCustomers = customers.filter((customer) => !customer.isDeleted);

    const invoiceFilter = { isDeleted: { $ne: true } };
    if (customerId) invoiceFilter.customerId = customerId;
    const invoices = await Invoice.find(invoiceFilter).lean();
    const filteredInvoices = invoices.filter((invoice) => inRange(invoice.date, from, to));

    const invoiceIds = invoices.map((invoice) => invoice.id);
    const payments = invoiceIds.length
      ? await Payment.find({ invoiceId: { $in: invoiceIds }, isDeleted: { $ne: true } }).lean()
      : [];
    const paymentsByInvoice = buildPaymentsByInvoice(payments);
    const oldDebtByInvoice = buildOldDebtByInvoice(invoices, paymentsByInvoice);

    const productIds = new Set();
    invoices.forEach((invoice) => {
      (invoice.items || []).forEach((item) => {
        if (item.productId) productIds.add(item.productId);
      });
    });
    const products = productIds.size
      ? await Product.find({ id: { $in: [...productIds] }, isDeleted: { $ne: true } }).lean()
      : [];
    const productMap = buildProductMap(products);

    const allRows = filteredInvoices
      .sort((a, b) => new Date(a.date) - new Date(b.date))
      .map((invoice) => ({
        ...buildInvoiceSummary(invoice, {
          customerMap,
          productMap,
          paymentsByInvoice,
          oldDebtByInvoice,
        }),
        items: buildInvoiceItems(invoice, productMap),
      }));

    const summary = allRows.reduce(
      (acc, row) => ({
        amount: acc.amount + Number(row.amount || 0),
        paid: acc.paid + Number(row.paid || 0),
        remain: acc.remain + Number(row.remain || 0),
        profit: acc.profit + Number(row.profit || 0),
      }),
      {
        amount: 0,
        paid: 0,
        remain: 0,
        profit: 0,
      }
    );
    const total = allRows.length;
    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    const currentPage = Math.min(page, totalPages);
    const start = (currentPage - 1) * pageSize;
    const rows = allRows.slice(start, start + pageSize);

    res.json({
      rows,
      summary,
      customers: activeCustomers.map((customer) => ({ id: customer.id, name: customer.name })),
      pagination: {
        total,
        page: currentPage,
        pageSize,
        totalPages,
      },
    });
  })
);

router.get(
  '/invoice-history',
  asyncHandler(async (req, res) => {
    const { from, to } = parseRange(req.query);
    const customerId = String(req.query.customerId || '').trim();

    const [customers, invoices] = await Promise.all([
      Customer.find({}).lean(),
      Invoice.find({}).lean(),
    ]);

    const customerMap = buildCustomerMap(customers);
    const activeCustomers = customers.filter((customer) => !customer.isDeleted);
    const rows = [];

    invoices.forEach((invoice) => {
      if (customerId && invoice.customerId !== customerId) return;
      const customer = customerMap[invoice.customerId];
      const base = {
        invoiceId: invoice.id,
        code: invoice.code,
        invoiceDate: invoice.date,
        staff: invoice.staff || 'admin',
        total: Number(invoice.total || 0),
        customerName: customer?.name || '',
        phone: customer?.phone || '',
        address: customer?.address || '',
      };

      const changeLogs = Array.isArray(invoice.changeLog) ? invoice.changeLog : [];
      changeLogs.forEach((log, index) => {
        if (!log?.date || !inRange(log.date, from, to)) return;
        if (log.note?.includes('Tạo hóa đơn') || log.note?.includes('Xóa hóa đơn')) return;
        rows.push({
          id: `${invoice.id}-edit-${index}`,
          action: 'edit',
          date: log.date,
          note: log.note || 'Cập nhật hóa đơn',
          ...base,
        });
      });

      if (invoice.isDeleted && invoice.deletedAt && inRange(invoice.deletedAt, from, to)) {
        rows.push({
          id: `${invoice.id}-delete`,
          action: 'delete',
          date: invoice.deletedAt,
          note: 'Xóa hóa đơn',
          ...base,
        });
      }
    });

    rows.sort((a, b) => new Date(b.date) - new Date(a.date));

    res.json({
      rows,
      customers: activeCustomers.map((customer) => ({ id: customer.id, name: customer.name })),
    });
  })
);

router.get(
  '/invoices/:id/preview',
  asyncHandler(async (req, res) => {
    const invoice = await Invoice.findOne({
      id: req.params.id,
    }).lean();
    if (!invoice) {
      res.status(404).json({ message: 'Invoice not found' });
      return;
    }

    const [customer, payments, purchases, allInvoices] = await Promise.all([
      Customer.findOne({ id: invoice.customerId }).lean(),
      Payment.find({ invoiceId: invoice.id, isDeleted: { $ne: true } }).lean(),
      Purchase.find({ isDeleted: { $ne: true } }).lean(),
      Invoice.find({ isDeleted: { $ne: true } }).lean(),
    ]);

    const productIds = new Set();
    (invoice.items || []).forEach((item) => {
      if (item.productId) productIds.add(item.productId);
    });
    const baseProducts = productIds.size
      ? await Product.find({ id: { $in: [...productIds] }, isDeleted: { $ne: true } }).lean()
      : [];
    const products = baseProducts.map((product) => ({
      ...product,
      stock: computeStock(product.id, purchases, allInvoices, baseProducts),
    }));
    const productMap = buildProductMap(products);
    const customerInvoices = allInvoices.filter((item) => item.customerId === invoice.customerId);
    const customerInvoiceIds = customerInvoices.map((item) => item.id);
    const customerPayments = customerInvoiceIds.length
      ? await Payment.find({
          invoiceId: { $in: customerInvoiceIds },
          isDeleted: { $ne: true },
        }).lean()
      : [];
    const paymentsByInvoice = buildPaymentsByInvoice(customerPayments);
    const oldDebtByInvoice = buildOldDebtByInvoice(customerInvoices, paymentsByInvoice);
    const financials = buildInvoiceFinancials(invoice, oldDebtByInvoice, paymentsByInvoice);

    res.json({
      invoice: {
        ...invoice,
        customerDebt: financials.oldDebt,
        ...financials,
      },
      customer,
      payments,
      products,
      items: buildInvoiceItems(invoice, productMap),
    });
  })
);

router.get(
  '/invoices/:id',
  asyncHandler(async (req, res) => {
    const invoice = await Invoice.findOne({
      id: req.params.id,
      isDeleted: { $ne: true },
    }).lean();
    if (!invoice) {
      res.status(404).json({ message: 'Invoice not found' });
      return;
    }

    const [customer, payments, purchases, allInvoices] = await Promise.all([
      Customer.findOne({ id: invoice.customerId, isDeleted: { $ne: true } }).lean(),
      Payment.find({ invoiceId: invoice.id, isDeleted: { $ne: true } }).lean(),
      Purchase.find({ isDeleted: { $ne: true } }).lean(),
      Invoice.find({ isDeleted: { $ne: true } }).lean(),
    ]);

    const productIds = new Set();
    (invoice.items || []).forEach((item) => {
      if (item.productId) productIds.add(item.productId);
    });
    const baseProducts = productIds.size
      ? await Product.find({ id: { $in: [...productIds] }, isDeleted: { $ne: true } }).lean()
      : [];
    const products = baseProducts.map((product) => ({
      ...product,
      stock: computeStock(product.id, purchases, allInvoices, baseProducts),
    }));
    const productMap = buildProductMap(products);
    const customerInvoices = allInvoices.filter((item) => item.customerId === invoice.customerId);
    const customerInvoiceIds = customerInvoices.map((item) => item.id);
    const customerPayments = customerInvoiceIds.length
      ? await Payment.find({
          invoiceId: { $in: customerInvoiceIds },
          isDeleted: { $ne: true },
        }).lean()
      : [];
    const paymentsByInvoice = buildPaymentsByInvoice(customerPayments);
    const oldDebtByInvoice = buildOldDebtByInvoice(customerInvoices, paymentsByInvoice);
    const financials = buildInvoiceFinancials(invoice, oldDebtByInvoice, paymentsByInvoice);

    res.json({
      invoice: {
        ...invoice,
        customerDebt: financials.oldDebt,
        ...financials,
      },
      customer,
      payments,
      products,
      items: buildInvoiceItems(invoice, productMap),
    });
  })
);

router.delete(
  '/invoices/:id',
  asyncHandler(async (req, res) => {
    const deletedAt = new Date().toISOString();
    const invoice = await Invoice.findOneAndUpdate(
      { id: req.params.id },
      { $set: { isDeleted: true, deletedAt } },
      { new: true }
    ).lean();

    if (!invoice) {
      res.status(404).json({ message: 'Invoice not found' });
      return;
    }

    await Payment.updateMany(
      { invoiceId: req.params.id },
      { $set: { isDeleted: true, deletedAt } }
    );

    res.json({ ok: true });
  })
);

router.get(
  '/profit',
  asyncHandler(async (req, res) => {
    const { from, to } = parseRange(req.query);
    const invoiceFilter = { isDeleted: { $ne: true } };
    if (from || to) {
      invoiceFilter.date = {};
      if (from) invoiceFilter.date.$gte = from.toISOString();
      if (to) invoiceFilter.date.$lte = to.toISOString();
    }

    const invoices = await Invoice.find(invoiceFilter).lean();
    const rows = buildProfitRows(invoices);

    const revenue = invoices.reduce((sum, inv) => sum + Number(inv.total || 0), 0);
    const cost = invoices.reduce((sum, inv) => {
      const invCost = (inv.items || []).reduce((acc, item) => {
        const qty = Number(item.qty || 0);
        const unitCost = Number(item.costPriceSnapshot || 0);
        const length = Number(item.length || 0);
        const width = Number(item.width || 0);
        const area = length > 0 && width > 0 ? length * width : 1;
        return acc + qty * unitCost * area;
      }, 0);
      return sum + invCost;
    }, 0);
    const profit = revenue - cost;

    const cashFilter = { isDeleted: { $ne: true } };
    if (from || to) {
      cashFilter.date = {};
      if (from) cashFilter.date.$gte = from.toISOString();
      if (to) cashFilter.date.$lte = to.toISOString();
    }
    const cashbook = await Cashbook.find(cashFilter).lean();

    const cashIn = cashbook.reduce((sum, entry) => {
      if (entry.type !== 'in') return sum;
      return sum + Number(entry.amount || 0);
    }, 0);
    const cashOut = cashbook.reduce((sum, entry) => {
      if (entry.type !== 'out') return sum;
      return sum + Number(entry.amount || 0);
    }, 0);

    res.json({
      rows,
      summary: {
        revenue,
        cost,
        profit,
        cashIn,
        cashOut,
      },
    });
  })
);

router.get(
  '/cash',
  asyncHandler(async (req, res) => {
    const { from, to } = parseRange(req.query);
    const cashFilter = { isDeleted: { $ne: true } };
    if (from || to) {
      cashFilter.date = {};
      if (from) cashFilter.date.$gte = from.toISOString();
      if (to) cashFilter.date.$lte = to.toISOString();
    }
    const cashbook = await Cashbook.find(cashFilter).lean();

    const cashIn = cashbook.reduce((sum, entry) => {
      if (entry.type !== 'in') return sum;
      return sum + Number(entry.amount || 0);
    }, 0);
    const cashOut = cashbook.reduce((sum, entry) => {
      if (entry.type !== 'out') return sum;
      return sum + Number(entry.amount || 0);
    }, 0);

    res.json({ cashIn, cashOut });
  })
);

export default router;
