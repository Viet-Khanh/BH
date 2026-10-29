// Packaging units (thùng, lốc…) over a product's base unit. Mirrors the
// quantity rule of banhang-backend/src/utils/productUnits.js (parity test).
const unitsOf = (product) =>
  Array.isArray(product?.units) ? product.units : [];

export const getItemFactor = (item = {}) => {
  const factor = Number(item?.factor);
  return Number.isFinite(factor) && factor > 0 ? factor : 1;
};

export const getBaseQty = (item = {}) =>
  Number(item?.qty || 0) * getItemFactor(item);

export const findProductUnit = (product, unitName) => {
  if (!unitName) return null;
  return unitsOf(product).find((unit) => unit.name === unitName) || null;
};

// Select options; value '' is the base unit.
export const getUnitOptions = (product) => [
  { value: '', label: product?.unit || '', factor: 1 },
  ...unitsOf(product).map((unit) => ({
    value: unit.name,
    label: `${unit.name} (${unit.factor} ${product?.unit || ''})`,
    factor: Number(unit.factor),
  })),
];

export const getUnitSellPrice = (product, unitName) => {
  const base = Number(product?.sellPriceDefault || 0);
  const unit = findProductUnit(product, unitName);
  if (!unit) return base;
  const price = unit.sellPrice;
  return price === null || price === undefined || price === ''
    ? Math.round(base * Number(unit.factor))
    : Number(price);
};

export const getUnitCostPrice = (product, unitName) => {
  const base = Number(product?.avgCost || 0);
  const unit = findProductUnit(product, unitName);
  return unit ? Math.round(base * Number(unit.factor)) : base;
};

const round3 = (value) => Math.round(value * 1000) / 1000;

// "2 thùng 3 lon": largest unit first, zero parts skipped.
export const formatStockByUnits = (product) => {
  const stock = Number(product?.stock ?? product?.openingStock ?? 0);
  const baseUnit = product?.unit || '';
  const units = [...unitsOf(product)].sort((a, b) => b.factor - a.factor);
  if (!units.length || stock <= 0) return `${stock} ${baseUnit}`.trim();
  let rest = stock;
  const parts = [];
  units.forEach((unit) => {
    const count = Math.floor(rest / unit.factor);
    if (count > 0) parts.push(`${count} ${unit.name}`);
    rest = round3(rest - count * unit.factor);
  });
  if (rest > 0) parts.push(`${rest} ${baseUnit}`);
  return parts.join(' ');
};

export const formatUnitsSummary = (product) => {
  const units = unitsOf(product);
  if (!units.length) return product?.unit || '';
  const list = units.map((unit) => `${unit.name} ${unit.factor}`).join(', ');
  return `${product?.unit || ''} (${list})`;
};

export const getItemUnitName = (item, product) =>
  item?.unitName || product?.unit || '';
