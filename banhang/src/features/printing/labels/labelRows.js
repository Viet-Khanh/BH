// State transitions of the label confirm list (rows carry their product for unit switches).
import { buildLabelJobs, buildLabelRow } from './buildLabelJobs.js';

const mergeProducts = (products = [], extraProducts = []) => {
  const byId = new Map();
  [...products, ...extraProducts].forEach((product) => {
    if (product?.id) byId.set(product.id, product);
  });
  return byId;
};

// Purchase lines → rows; `skippable` remembers whether the base unit already had a barcode.
// `labelWidthMm` (label settings) enables the "barcode too long" warning.
export const createPurchaseRows = (
  items = [],
  products = [],
  extraProducts = [],
  { labelWidthMm } = {}
) => {
  const byId = mergeProducts(products, extraProducts);
  return buildLabelJobs({
    items,
    products: [...byId.values()],
    skipWithBarcode: false,
    labelWidthMm,
  }).map((row) => ({
    ...row,
    product: byId.get(row.productId),
    skippable: row.hasOwnBarcode,
  }));
};

// After saving a purchase every imported product gets a price label by default (the shop
// asked for labels "ứng với số hàng nhập và giá tiền"); skipping products that already carry
// a manufacturer barcode is opt-in.
export const getPurchaseLabelStart = (rows = []) => ({
  open: rows.length > 0,
  skipWithBarcode: false,
});

// One label of the base unit (catalog "In tem").
export const createProductRows = (product, options = {}) =>
  product?.id
    ? [
        {
          ...buildLabelRow(product, '', 1, undefined, options),
          product,
          skippable: false,
        },
      ]
    : [];

const updateRow = (rows, key, update) =>
  rows.map((row) => (row.key === key ? update(row) : row));

export const setRowUnit = (rows, key, unitName, options = {}) =>
  updateRow(rows, key, (row) => ({
    ...buildLabelRow(row.product, unitName, undefined, row.baseCount, options),
    key: row.key,
    product: row.product,
    skippable: row.skippable,
  }));

// Upper bound per row: a barcode scanned into the count field must not become a huge job.
export const MAX_LABELS_PER_ROW = 9999;

export const setRowCount = (rows, key, count) => {
  const next = Math.max(0, Math.floor(Number(count) || 0));
  if (next > MAX_LABELS_PER_ROW) return rows;
  return updateRow(rows, key, (row) => ({ ...row, count: next }));
};

export const getVisibleRows = (rows, skipWithBarcode) =>
  skipWithBarcode ? rows.filter((row) => !row.skippable) : rows;

export const getPrintableRows = (rows, skipWithBarcode) =>
  getVisibleRows(rows, skipWithBarcode).filter((row) => row.count > 0);

export const countLabels = (rows) =>
  rows.reduce((sum, row) => sum + Math.max(0, Number(row.count) || 0), 0);
