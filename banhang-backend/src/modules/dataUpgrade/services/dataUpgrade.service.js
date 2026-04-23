import Customer from '../../../models/Customer.js';
import Invoice from '../../../models/Invoice.js';
import Payment from '../../../models/Payment.js';
import Product from '../../../models/Product.js';
import Purchase from '../../../models/Purchase.js';
import Settings from '../../../models/Settings.js';
import {
  getDataVersion,
  isSnapshotReady,
  SNAPSHOT_DATA_VERSION,
} from '../../../utils/snapshotStatus.js';

const active = (item) => item && item.isDeleted !== true;
const num = (value) => Number(value || 0);

export const buildStockSnapshot = ({
  products = [],
  purchases = [],
  invoices = [],
}) => {
  const stockByProductId = {};
  products.filter(active).forEach((product) => {
    stockByProductId[product.id] = num(product.openingStock);
  });

  purchases.filter(active).forEach((purchase) => {
    if (purchase.appliedToStock) return;
    (purchase.items || []).forEach((item) => {
      if (!item.productId || stockByProductId[item.productId] === undefined) {
        return;
      }
      stockByProductId[item.productId] += num(item.qty);
    });
  });

  invoices.filter(active).forEach((invoice) => {
    (invoice.items || []).forEach((item) => {
      if (!item.productId || stockByProductId[item.productId] === undefined) {
        return;
      }
      stockByProductId[item.productId] -= num(item.qty);
    });
  });

  return stockByProductId;
};

export const buildCustomerDebtSnapshot = ({
  customers = [],
  invoices = [],
  payments = [],
}) => {
  const debtByCustomerId = {};
  const invoiceCustomerMap = {};

  customers.filter(active).forEach((customer) => {
    debtByCustomerId[customer.id] = 0;
  });

  invoices.filter(active).forEach((invoice) => {
    if (
      !invoice.customerId ||
      debtByCustomerId[invoice.customerId] === undefined
    ) {
      return;
    }
    invoiceCustomerMap[invoice.id] = invoice.customerId;
    debtByCustomerId[invoice.customerId] += num(invoice.total);
  });

  payments.filter(active).forEach((payment) => {
    const paymentType = payment.paymentType || 'invoice_payment';
    if (paymentType === 'debt_receipt') {
      if (debtByCustomerId[payment.customerId] !== undefined) {
        debtByCustomerId[payment.customerId] -= num(payment.amount);
      }
      return;
    }
    if (paymentType !== 'invoice_payment' && payment.paymentType) return;
    const customerId =
      payment.customerId || invoiceCustomerMap[payment.invoiceId];
    if (debtByCustomerId[customerId] !== undefined) {
      debtByCustomerId[customerId] -= num(payment.amount);
    }
  });

  return debtByCustomerId;
};

export const buildDataUpgradePreview = ({
  products,
  customers,
  purchases,
  invoices,
  payments,
  settings,
}) => {
  const stockByProductId = buildStockSnapshot({
    products,
    purchases,
    invoices,
  });
  const debtByCustomerId = buildCustomerDebtSnapshot({
    customers,
    invoices,
    payments,
  });

  const productRows = products.filter(active).map((product) => {
    const stock = num(stockByProductId[product.id]);
    const currentStock =
      product.stock === undefined ? null : num(product.stock);
    return {
      id: product.id,
      code: product.code || '',
      name: product.name || '',
      unit: product.unit || '',
      stock,
      currentStock,
      diff: currentStock === null ? stock : stock - currentStock,
    };
  });

  const customerRows = customers.filter(active).map((customer) => {
    const currentDebt =
      customer.currentDebt === undefined ? null : num(customer.currentDebt);
    const debt = num(debtByCustomerId[customer.id]);
    return {
      id: customer.id,
      name: customer.name || '',
      phone: customer.phone || '',
      debt,
      currentDebt,
      diff: currentDebt === null ? debt : debt - currentDebt,
    };
  });

  const negativeStockProducts = productRows
    .filter((product) => product.stock < 0)
    .sort((left, right) => left.stock - right.stock)
    .slice(0, 20);
  const debtorCustomers = customerRows
    .filter((customer) => customer.debt > 0)
    .sort((left, right) => right.debt - left.debt)
    .slice(0, 20);
  const creditCustomers = customerRows
    .filter((customer) => customer.debt < 0)
    .sort((left, right) => left.debt - right.debt)
    .slice(0, 20);

  return {
    status: {
      dataVersion: getDataVersion(settings),
      targetVersion: SNAPSHOT_DATA_VERSION,
      snapshotReady: isSnapshotReady(settings),
    },
    summary: {
      productCount: productRows.length,
      customerCount: customerRows.length,
      negativeStockCount: productRows.filter((item) => item.stock < 0).length,
      debtorCount: customerRows.filter((item) => item.debt > 0).length,
      customerCreditCount: customerRows.filter((item) => item.debt < 0).length,
      totalDebt: customerRows.reduce(
        (sum, item) => sum + Math.max(num(item.debt), 0),
        0
      ),
      totalCredit: customerRows.reduce(
        (sum, item) => sum + Math.abs(Math.min(num(item.debt), 0)),
        0
      ),
      netDebt: customerRows.reduce((sum, item) => sum + num(item.debt), 0),
      stockChangedCount: productRows.filter((item) => item.diff !== 0).length,
      debtChangedCount: customerRows.filter((item) => item.diff !== 0).length,
    },
    products: productRows,
    customers: customerRows,
    negativeStockProducts,
    debtorCustomers,
    creditCustomers,
  };
};

const buildStockReconcileRows = (products = []) =>
  products
    .filter((product) => product.diff !== 0)
    .sort((left, right) => Math.abs(right.diff) - Math.abs(left.diff))
    .map((product) => ({
      productId: product.id,
      code: product.code,
      name: product.name,
      unit: product.unit,
      snapshotStock: product.currentStock,
      computedStock: product.stock,
      diff: product.diff,
    }));

const buildDebtReconcileRows = (customers = []) =>
  customers
    .filter((customer) => customer.diff !== 0)
    .sort((left, right) => Math.abs(right.diff) - Math.abs(left.diff))
    .map((customer) => ({
      customerId: customer.id,
      name: customer.name,
      phone: customer.phone,
      snapshotDebt: customer.currentDebt,
      computedDebt: customer.debt,
      diff: customer.diff,
    }));

export const buildDataReconcileReport = (inputs) => {
  const preview = buildDataUpgradePreview(inputs);
  const stockRows = buildStockReconcileRows(preview.products);
  const debtRows = buildDebtReconcileRows(preview.customers);

  return {
    status: preview.status,
    stock: {
      checked: preview.products.length,
      matched: preview.products.length - stockRows.length,
      mismatched: stockRows.length,
      totalDiff: stockRows.reduce((sum, item) => sum + num(item.diff), 0),
      rows: stockRows.slice(0, 100),
    },
    debt: {
      checked: preview.customers.length,
      matched: preview.customers.length - debtRows.length,
      mismatched: debtRows.length,
      totalDiff: debtRows.reduce((sum, item) => sum + num(item.diff), 0),
      rows: debtRows.slice(0, 100),
    },
    generatedAt: new Date().toISOString(),
  };
};

const loadSnapshotInputs = async () => {
  const [products, customers, purchases, invoices, payments, settings] =
    await Promise.all([
      Product.find({ isDeleted: { $ne: true } }).lean(),
      Customer.find({ isDeleted: { $ne: true } }).lean(),
      Purchase.find({ isDeleted: { $ne: true } }).lean(),
      Invoice.find({ isDeleted: { $ne: true } }).lean(),
      Payment.find({ isDeleted: { $ne: true } }).lean(),
      Settings.findOne({ id: 'main' }).lean(),
    ]);

  return { products, customers, purchases, invoices, payments, settings };
};

export const getDataUpgradeStatus = async () => {
  const settings = await Settings.findOne({ id: 'main' }).lean();
  return {
    dataVersion: getDataVersion(settings),
    targetVersion: SNAPSHOT_DATA_VERSION,
    snapshotReady: isSnapshotReady(settings),
  };
};

export const previewDataUpgrade = async () =>
  buildDataUpgradePreview(await loadSnapshotInputs());

export const reconcileDataUpgrade = async () =>
  buildDataReconcileReport(await loadSnapshotInputs());

export const commitDataUpgrade = async () => {
  const preview = await previewDataUpgrade();
  const now = new Date().toISOString();

  if (preview.products.length) {
    await Product.bulkWrite(
      preview.products.map((product) => ({
        updateOne: {
          filter: { id: product.id },
          update: { $set: { stock: product.stock, stockUpdatedAt: now } },
        },
      })),
      { ordered: true }
    );
  }

  if (preview.customers.length) {
    await Customer.bulkWrite(
      preview.customers.map((customer) => ({
        updateOne: {
          filter: { id: customer.id },
          update: { $set: { currentDebt: customer.debt, debtUpdatedAt: now } },
        },
      })),
      { ordered: true }
    );
  }

  await Settings.findOneAndUpdate(
    { id: 'main' },
    {
      $set: {
        dataVersion: SNAPSHOT_DATA_VERSION,
        stockDebtSnapshotAt: now,
      },
    },
    { upsert: true, new: true }
  ).lean();

  return {
    ...preview,
    status: {
      dataVersion: SNAPSHOT_DATA_VERSION,
      targetVersion: SNAPSHOT_DATA_VERSION,
      snapshotReady: true,
    },
    committedAt: now,
  };
};
