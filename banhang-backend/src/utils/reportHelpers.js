import dayjs from 'dayjs';

export const toStartOfDay = (value) => dayjs(value).startOf('day');
export const toEndOfDay = (value) => dayjs(value).endOf('day');
export const isValidDate = (value) => value && dayjs(value).isValid();

export const parseRange = (query) => {
  const from = isValidDate(query.from) ? toStartOfDay(query.from) : null;
  const to = isValidDate(query.to) ? toEndOfDay(query.to) : null;
  return { from, to };
};

export const parsePagination = (query = {}) => {
  const rawPage = Number(query.page || 1);
  const rawPageSize = Number(query.pageSize || 20);
  const page =
    Number.isFinite(rawPage) && rawPage > 0 ? Math.floor(rawPage) : 1;
  const pageSize =
    Number.isFinite(rawPageSize) && rawPageSize > 0
      ? Math.min(Math.floor(rawPageSize), 200)
      : 20;
  return { page, pageSize };
};

export const paginateRows = (rows = [], { page, pageSize }) => {
  const total = rows.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const currentPage = Math.min(page, totalPages);
  const start = (currentPage - 1) * pageSize;

  return {
    rows: rows.slice(start, start + pageSize),
    meta: {
      total,
      page: currentPage,
      pageSize,
      totalPages,
    },
  };
};

export const inRange = (dateValue, from, to) => {
  if (!dateValue) return false;
  const target = dayjs(dateValue);
  if (from && target.isBefore(from)) return false;
  if (to && target.isAfter(to)) return false;
  return true;
};

export const compareDatedRecords = (left, right) => {
  const dateDiff = new Date(left?.date) - new Date(right?.date);
  if (dateDiff !== 0) return dateDiff;
  return String(left?._id || left?.id || '').localeCompare(
    String(right?._id || right?.id || '')
  );
};

export const compareDatedRecordsNewestFirst = (left, right) =>
  compareDatedRecords(right, left);

export const buildPaymentsByPurchase = (payments = []) => {
  const map = {};
  payments.forEach((payment) => {
    if (!payment.purchaseId) return;
    if (payment.paymentType === 'supplier_debt_payment') return;
    map[payment.purchaseId] =
      (map[payment.purchaseId] || 0) + Number(payment.amount || 0);
  });
  return map;
};

export const buildSupplierDebtPaymentsBySupplier = (payments = []) => {
  const map = {};
  payments.forEach((payment) => {
    if (payment.paymentType !== 'supplier_debt_payment') return;
    if (!payment.supplierId) return;
    map[payment.supplierId] =
      (map[payment.supplierId] || 0) + Number(payment.amount || 0);
  });
  return map;
};

export const buildDebtReceiptsByCustomer = (payments = []) => {
  const map = {};
  payments.forEach((payment) => {
    if (payment.paymentType !== 'debt_receipt') return;
    if (!payment.customerId) return;
    map[payment.customerId] =
      (map[payment.customerId] || 0) + Number(payment.amount || 0);
  });
  return map;
};

export const buildCustomerMap = (customers = []) =>
  customers.reduce((acc, customer) => {
    acc[customer.id] = customer;
    return acc;
  }, {});

export const buildProductMap = (products = []) =>
  products.reduce((acc, product) => {
    acc[product.id] = product;
    return acc;
  }, {});

export const getAreaMultiplier = (item) => {
  const length = Number(item.length || 0);
  const width = Number(item.width || 0);
  return length > 0 && width > 0 ? length * width : 1;
};

export const isProfitExcludedItem = (item, productMap = {}) => {
  if (
    item?.excludeFromProfitSnapshot !== undefined &&
    item?.excludeFromProfitSnapshot !== null
  ) {
    return Boolean(item.excludeFromProfitSnapshot);
  }
  return Boolean(productMap[item?.productId]?.excludeFromProfit);
};

export const getInvoiceItemLineTotal = (item) => {
  const qty = Number(item.qty || 0);
  const unitPrice = Number(item.unitPrice || 0);
  const lineTotalValue = item.lineTotal ?? qty * unitPrice;
  return Number(lineTotalValue || 0);
};

export const getInvoiceItemCostTotal = (item, productMap = {}) => {
  const qty = Number(item.qty || 0);
  const product = productMap[item.productId] || {};
  const costUnit = Number(item.costPriceSnapshot ?? product.avgCost ?? 0);
  return qty * costUnit * getAreaMultiplier(item);
};

export const buildInvoiceProfitFinancials = (invoice, productMap = {}) =>
  (invoice.items || []).reduce(
    (acc, item) => {
      if (isProfitExcludedItem(item, productMap)) return acc;
      const lineTotal = getInvoiceItemLineTotal(item);
      const costTotal = getInvoiceItemCostTotal(item, productMap);
      acc.revenue += lineTotal;
      acc.cost += costTotal;
      acc.profit += lineTotal - costTotal;
      return acc;
    },
    { revenue: 0, cost: 0, profit: 0 }
  );

export const getInvoiceAmount = (invoice) => {
  if (invoice.total !== undefined && invoice.total !== null) {
    return Number(invoice.total || 0);
  }
  return (invoice.items || []).reduce((sum, item) => {
    return sum + getInvoiceItemLineTotal(item);
  }, 0);
};

export const buildInvoiceFinancials = (
  invoice,
  oldDebtByInvoice = {},
  paymentsByInvoice = {}
) => {
  const amount = getInvoiceAmount(invoice);
  const oldDebt = Number(oldDebtByInvoice[invoice.id] || 0);
  const paid = Number(paymentsByInvoice[invoice.id] || 0);
  const totalPay = amount + oldDebt;
  const remain = totalPay - paid;
  return { amount, oldDebt, totalPay, paid, remain };
};

export const buildCustomerDebtTimeline = ({
  invoices = [],
  invoicePayments = [],
  debtReceipts = [],
  from,
  to,
}) => {
  const invoiceMap = invoices.reduce((acc, invoice) => {
    acc[invoice.id] = invoice;
    return acc;
  }, {});

  const events = [
    ...invoices.map((invoice) => ({
      id: `invoice:${invoice.id}`,
      date: invoice.date,
      type: 'invoice',
      title: invoice.code || invoice.id || 'Hóa đơn bán hàng',
      amount: getInvoiceAmount(invoice),
      paid: 0,
      sortKey: String(invoice._id || invoice.id || ''),
    })),
    ...invoicePayments
      .filter((payment) => payment.invoiceId)
      .map((payment) => {
        const invoice = invoiceMap[payment.invoiceId] || {};
        return {
          id: `invoice-payment:${payment.id}`,
          date: payment.date,
          type: 'invoice_payment',
          title: invoice.code ? `Thu tiền ${invoice.code}` : 'Thu tiền hóa đơn',
          amount: 0,
          paid: Number(payment.amount || 0),
          sortKey: String(payment._id || payment.id || ''),
        };
      }),
    ...debtReceipts.map((payment) => ({
      id: `debt-receipt:${payment.id}`,
      date: payment.date,
      type: 'debt_receipt',
      title: payment.code || 'Phiếu thu nợ',
      amount: 0,
      paid: Number(payment.amount || 0),
      sortKey: String(payment._id || payment.id || ''),
    })),
  ]
    .filter((event) => event.date && dayjs(event.date).isValid())
    .sort((left, right) => {
      const dateDiff = new Date(left.date) - new Date(right.date);
      if (dateDiff !== 0) return dateDiff;

      const orderMap = {
        invoice: 0,
        invoice_payment: 1,
        debt_receipt: 2,
      };
      const orderDiff =
        (orderMap[left.type] ?? 99) - (orderMap[right.type] ?? 99);
      if (orderDiff !== 0) return orderDiff;

      return String(left.sortKey || left.id || '').localeCompare(
        String(right.sortKey || right.id || '')
      );
    });

  let balance = 0;
  let openingBalance = 0;
  const rows = [];

  events.forEach((event) => {
    const eventDate = dayjs(event.date);
    const delta = Number(event.amount || 0) - Number(event.paid || 0);

    if (from && eventDate.isBefore(from)) {
      balance += delta;
      openingBalance = balance;
      return;
    }

    if (to && eventDate.isAfter(to)) return;

    const oldDebt = balance;
    const amount = Number(event.amount || 0);
    const paid = Number(event.paid || 0);
    const totalPay = oldDebt + amount;
    const remain = totalPay - paid;
    balance = remain;
    rows.push({
      ...event,
      oldDebt,
      totalPay,
      remain,
    });
  });

  return {
    openingBalance,
    closingBalance: rows.length
      ? Number(rows[rows.length - 1].remain || 0)
      : balance,
    rows,
  };
};

import { buildPaymentsByInvoice } from './customerDebt.js';

export const buildCustomerDebtTimelineByInvoiceOrder = ({
  invoices = [],
  invoicePayments = [],
  debtReceipts = [],
  from,
  to,
}) => {
  const paymentsByInvoice = buildPaymentsByInvoice(invoicePayments);
  const events = [
    ...invoices.map((invoice) => ({
      id: `invoice:${invoice.id}`,
      date: invoice.date,
      type: 'invoice',
      title: invoice.code || invoice.id || 'Hóa đơn bán hàng',
      amount: getInvoiceAmount(invoice),
      paid: Number(paymentsByInvoice[invoice.id] || 0),
      sortKey: String(invoice._id || invoice.id || ''),
    })),
    ...debtReceipts.map((payment) => ({
      id: `debt-receipt:${payment.id}`,
      date: payment.date,
      type: 'debt_receipt',
      title: payment.code || 'Phiếu thu nợ',
      amount: 0,
      paid: Number(payment.amount || 0),
      sortKey: String(payment._id || payment.id || ''),
    })),
  ]
    .filter((event) => event.date && dayjs(event.date).isValid())
    .sort((left, right) => {
      const dateDiff = new Date(left.date) - new Date(right.date);
      if (dateDiff !== 0) return dateDiff;

      const orderMap = {
        invoice: 0,
        debt_receipt: 2,
      };
      const orderDiff =
        (orderMap[left.type] ?? 99) - (orderMap[right.type] ?? 99);
      if (orderDiff !== 0) return orderDiff;

      return String(left.sortKey || left.id || '').localeCompare(
        String(right.sortKey || right.id || '')
      );
    });

  let balance = 0;
  let openingBalance = 0;
  const rows = [];

  events.forEach((event) => {
    const eventDate = dayjs(event.date);
    const delta = Number(event.amount || 0) - Number(event.paid || 0);

    if (from && eventDate.isBefore(from)) {
      balance += delta;
      openingBalance = balance;
      return;
    }

    if (to && eventDate.isAfter(to)) return;

    const oldDebt = balance;
    const amount = Number(event.amount || 0);
    const paid = Number(event.paid || 0);
    const totalPay = oldDebt + amount;
    const remain = totalPay - paid;
    balance = remain;
    rows.push({
      ...event,
      oldDebt,
      totalPay,
      remain,
    });
  });

  return {
    openingBalance,
    closingBalance: rows.length
      ? Number(rows[rows.length - 1].remain || 0)
      : balance,
    rows,
  };
};

export const computeInvoiceCost = (invoice, productMap = {}) =>
  buildInvoiceProfitFinancials(invoice, productMap).cost;

export const buildInvoiceSummary = (
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
  const { profit } = buildInvoiceProfitFinancials(invoice, productMap);

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

export const buildInvoiceItems = (invoice, productMap = {}) =>
  (invoice.items || []).map((item, index) => {
    const product = productMap[item.productId] || {};
    const qty = Number(item.qty || 0);
    const unitPrice = Number(item.unitPrice || 0);
    const lineTotal = getInvoiceItemLineTotal(item);
    const costUnit = Number(item.costPriceSnapshot ?? product.avgCost ?? 0);
    const excludedFromProfit = isProfitExcludedItem(item, productMap);
    const costTotal = excludedFromProfit
      ? 0
      : getInvoiceItemCostTotal(item, productMap);
    const profit = excludedFromProfit ? 0 : lineTotal - costTotal;
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
      excludedFromProfit,
      note: item.lineNote || '',
    };
  });

export const buildProfitRows = (invoices = []) => {
  const map = {};
  invoices.forEach((invoice) => {
    const key = dayjs(invoice.date).format('YYYY-MM-DD');
    if (!map[key]) {
      map[key] = { date: key, revenue: 0, cost: 0, profit: 0 };
    }
    const { revenue, cost, profit } = buildInvoiceProfitFinancials(invoice);
    map[key].revenue += revenue;
    map[key].cost += cost;
    map[key].profit += profit;
  });

  return Object.values(map).sort((a, b) => (a.date > b.date ? 1 : -1));
};
