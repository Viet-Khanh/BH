export const buildPaymentsByInvoice = (payments = []) => {
  const map = {};
  payments.forEach((payment) => {
    map[payment.invoiceId] = (map[payment.invoiceId] || 0) + Number(payment.amount || 0);
  });
  return map;
};

export const buildOldDebtByInvoice = (invoices = [], paymentsByInvoice = {}) => {
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

export const computeInvoiceCost = (invoice, productMap = {}) =>
  (invoice.items || []).reduce((sum, item) => {
    const qty = Number(item.qty || 0);
    const snapshotCost = item.costPriceSnapshot;
    const fallbackCost = productMap[item.productId]?.avgCost;
    const costUnit = Number(snapshotCost ?? fallbackCost ?? 0);
    const area = getAreaMultiplier(item);
    return sum + qty * costUnit * area;
  }, 0);

export const buildInvoiceSummary = (
  invoice,
  { customerMap, productMap, paymentsByInvoice, oldDebtByInvoice }
) => {
  const items = invoice.items || [];
  const customer = customerMap[invoice.customerId];
  const paid = paymentsByInvoice[invoice.id] || 0;
  const itemsCount = items.length;
  const qtySum = items.reduce((sum, item) => sum + Number(item.qty || 0), 0);
  const amount = getInvoiceAmount(invoice);
  const cost = computeInvoiceCost(invoice, productMap);
  const profit = amount - cost;
  const oldDebt = oldDebtByInvoice[invoice.id] || 0;
  const totalPay = amount + oldDebt;
  const remain = totalPay - paid;

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
    const lineTotalValue = item.lineTotal ?? qty * unitPrice;
    const lineTotal = Number(lineTotalValue || 0);
    return {
      key: `${invoice.id}-${index}`,
      name: product.name || 'Sản phẩm',
      unit: product.unit || '',
      spec: product.spec || '',
      qty,
      unitPrice,
      lineTotal,
      note: item.lineNote || '',
    };
  });
