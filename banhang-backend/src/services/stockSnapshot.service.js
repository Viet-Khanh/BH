import Product from '../models/Product.js';
import Settings from '../models/Settings.js';
import { isSnapshotReady } from '../utils/snapshotStatus.js';

export const buildQtyMapFromItems = (items = []) =>
  items.reduce((acc, item) => {
    if (!item?.productId) return acc;
    acc[item.productId] = (acc[item.productId] || 0) + Number(item.qty || 0);
    return acc;
  }, {});

export const normalizeStockDeltas = (deltas = []) => {
  const map = {};
  deltas.forEach((item) => {
    if (!item?.productId) return;
    const delta = Number(item.delta || 0);
    if (!Number.isFinite(delta) || delta === 0) return;
    map[item.productId] = (map[item.productId] || 0) + delta;
  });
  return Object.entries(map)
    .filter(([, delta]) => delta !== 0)
    .map(([productId, delta]) => ({ productId, delta }));
};

export const invertStockDeltas = (deltas = []) =>
  normalizeStockDeltas(
    deltas.map((item) => ({
      productId: item.productId,
      delta: -Number(item.delta || 0),
    }))
  );

export const buildInvoiceCreateStockDeltas = (items = []) =>
  Object.entries(buildQtyMapFromItems(items)).map(([productId, qty]) => ({
    productId,
    delta: -Number(qty || 0),
  }));

export const buildInvoiceDeleteStockDeltas = (items = []) =>
  invertStockDeltas(buildInvoiceCreateStockDeltas(items));

export const buildItemUpdateStockDeltas = (oldItems = [], nextItems = []) => {
  const oldMap = buildQtyMapFromItems(oldItems);
  const nextMap = buildQtyMapFromItems(nextItems);
  const productIds = new Set([...Object.keys(oldMap), ...Object.keys(nextMap)]);
  return normalizeStockDeltas(
    [...productIds].map((productId) => ({
      productId,
      delta: Number(oldMap[productId] || 0) - Number(nextMap[productId] || 0),
    }))
  );
};

export const buildPurchaseStockDeltas = (oldItems = [], nextItems = []) =>
  invertStockDeltas(buildItemUpdateStockDeltas(oldItems, nextItems));

const getMainSettings = () => Settings.findOne({ id: 'main' }).lean();

const getProductStock = (product) =>
  Number(product?.stock ?? product?.openingStock ?? 0);

const validateStockDeltas = async (deltas, settings) => {
  if (settings?.allowNegativeStock) return;
  const ids = deltas.map((item) => item.productId);
  const products = await Product.find(
    { id: { $in: ids }, isDeleted: { $ne: true } },
    { id: 1, name: 1, stock: 1, openingStock: 1 }
  ).lean();
  const productMap = new Map(products.map((product) => [product.id, product]));

  deltas.forEach(({ productId, delta }) => {
    const product = productMap.get(productId);
    if (!product) throw new Error('Product not found');
    const nextStock = getProductStock(product) + Number(delta || 0);
    if (nextStock < 0) {
      throw new Error(`Không đủ tồn kho cho sản phẩm ${product.name || ''}.`);
    }
  });
};

export const applyStockDeltas = async (rawDeltas = [], options = {}) => {
  const deltas = normalizeStockDeltas(rawDeltas);
  if (!deltas.length) return { applied: false, deltas: [] };

  const settings = options.settings || (await getMainSettings());
  if (!options.force && !isSnapshotReady(settings)) {
    return { applied: false, deltas: [] };
  }

  await validateStockDeltas(deltas, settings);
  const now = new Date().toISOString();
  const operations = deltas.map(({ productId, delta }) => ({
    updateOne: {
      filter: { id: productId },
      update: { $inc: { stock: delta }, $set: { stockUpdatedAt: now } },
    },
  }));

  await Product.bulkWrite(operations, { ordered: true });
  return { applied: true, deltas };
};
