import { computeStock } from '../../../utils/stock.js';
import { isSnapshotReady } from '../../../utils/snapshotStatus.js';
import { buildProfitRows, parseRange } from '../../../utils/reportHelpers.js';
import {
  findCashbookEntries,
  findInvoices,
  findMainSettings,
  findProducts,
  findPurchases,
} from '../repositories/reports.repository.js';

export const getStockReport = async () => {
  const settings = await findMainSettings();
  const products = await findProducts({ isDeleted: { $ne: true } });

  if (isSnapshotReady(settings)) {
    const rows = products.map((product) => {
      const stock = Number(product.stock ?? product.openingStock ?? 0);
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
    return { rows, lowStockThreshold: settings?.lowStockThreshold ?? 0 };
  }

  const [purchases, invoices] = await Promise.all([
    findPurchases({ isDeleted: { $ne: true } }),
    findInvoices({ isDeleted: { $ne: true } }),
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

  return { rows, lowStockThreshold: settings?.lowStockThreshold ?? 0 };
};

export const getProfitReport = async (query) => {
  const { from, to } = parseRange(query);
  const invoiceFilter = { isDeleted: { $ne: true } };
  if (from || to) {
    invoiceFilter.date = {};
    if (from) invoiceFilter.date.$gte = from.toISOString();
    if (to) invoiceFilter.date.$lte = to.toISOString();
  }

  const invoices = await findInvoices(invoiceFilter);
  const rows = buildProfitRows(invoices);

  const revenue = invoices.reduce(
    (sum, invoice) => sum + Number(invoice.total || 0),
    0
  );
  const cost = invoices.reduce((sum, invoice) => {
    const invoiceCost = (invoice.items || []).reduce((acc, item) => {
      const qty = Number(item.qty || 0);
      const unitCost = Number(item.costPriceSnapshot || 0);
      const length = Number(item.length || 0);
      const width = Number(item.width || 0);
      const area = length > 0 && width > 0 ? length * width : 1;
      return acc + qty * unitCost * area;
    }, 0);
    return sum + invoiceCost;
  }, 0);
  const profit = revenue - cost;

  const cashFilter = { isDeleted: { $ne: true } };
  if (from || to) {
    cashFilter.date = {};
    if (from) cashFilter.date.$gte = from.toISOString();
    if (to) cashFilter.date.$lte = to.toISOString();
  }
  const cashbook = await findCashbookEntries(cashFilter);

  const cashIn = cashbook.reduce((sum, entry) => {
    if (entry.type !== 'in') return sum;
    return sum + Number(entry.amount || 0);
  }, 0);
  const cashOut = cashbook.reduce((sum, entry) => {
    if (entry.type !== 'out') return sum;
    return sum + Number(entry.amount || 0);
  }, 0);

  return {
    rows,
    summary: {
      revenue,
      cost,
      profit,
      cashIn,
      cashOut,
    },
  };
};

export const getCashReport = async (query) => {
  const { from, to } = parseRange(query);
  const cashFilter = { isDeleted: { $ne: true } };
  if (from || to) {
    cashFilter.date = {};
    if (from) cashFilter.date.$gte = from.toISOString();
    if (to) cashFilter.date.$lte = to.toISOString();
  }

  const cashbook = await findCashbookEntries(cashFilter);
  const cashIn = cashbook.reduce((sum, entry) => {
    if (entry.type !== 'in') return sum;
    return sum + Number(entry.amount || 0);
  }, 0);
  const cashOut = cashbook.reduce((sum, entry) => {
    if (entry.type !== 'out') return sum;
    return sum + Number(entry.amount || 0);
  }, 0);

  return { cashIn, cashOut };
};
