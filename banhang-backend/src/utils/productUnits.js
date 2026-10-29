// banhang-backend/src/utils/productUnits.js
// Packaging units (thùng, lốc…) over a product's base unit. Stock, cost and
// profit are always computed in base units: base qty = qty × factor.
export const MAX_PRODUCT_UNITS = 5;

export const getItemFactor = (item = {}) => {
  const factor = Number(item?.factor);
  return Number.isFinite(factor) && factor > 0 ? factor : 1;
};

export const getBaseQty = (item = {}) =>
  Number(item?.qty || 0) * getItemFactor(item);

const sameName = (a, b) =>
  String(a || '').trim().toLowerCase() === String(b || '').trim().toLowerCase();

const toPrice = (value) =>
  value === null || value === undefined || value === '' ? null : Number(value);

const findUnitError = (units, baseUnit) => {
  if (units.length > MAX_PRODUCT_UNITS) {
    return `Tối đa ${MAX_PRODUCT_UNITS} đơn vị quy đổi.`;
  }
  for (const [index, unit] of units.entries()) {
    if (sameName(unit.name, baseUnit)) {
      return `Đơn vị quy đổi "${unit.name}" trùng đơn vị cơ bản.`;
    }
    if (units.slice(0, index).some((other) => sameName(other.name, unit.name))) {
      return `Đơn vị quy đổi "${unit.name}" bị trùng.`;
    }
    if (!Number.isFinite(unit.factor) || unit.factor <= 1) {
      return `Hệ số quy đổi của "${unit.name}" phải lớn hơn 1.`;
    }
    if (unit.sellPrice !== null && !(unit.sellPrice >= 0)) {
      return `Giá bán của "${unit.name}" phải >= 0.`;
    }
  }
  return null;
};

// Cleans the units list from a product payload; `error` is a user message.
export const normalizeProductUnits = (rawUnits, baseUnit) => {
  const units = (Array.isArray(rawUnits) ? rawUnits : [])
    .filter((unit) => String(unit?.name || '').trim())
    .map((unit) => ({
      name: String(unit.name).trim(),
      factor: Number(unit.factor),
      sellPrice: toPrice(unit.sellPrice),
    }));
  return { units, error: findUnitError(units, baseUnit) };
};

// Normalizes the unit of one invoice/purchase line against its product.
// Base-unit lines carry no unit fields (same shape as before units existed).
export const resolveLineUnit = (item, product) => {
  if (!product) return item;
  const { unitName, factor, ...rest } = item;
  const name = String(unitName || '').trim();
  if (!name || sameName(name, product.unit)) return rest;
  const snapshot = Number(factor);
  if (Number.isFinite(snapshot) && snapshot > 0) {
    return { ...rest, unitName: name, factor: snapshot };
  }
  const unit = (product.units || []).find((entry) => sameName(entry.name, name));
  if (!unit) {
    throw new Error(`Đơn vị "${name}" không có trong hàng ${product.name || ''}.`);
  }
  return { ...rest, unitName: unit.name, factor: Number(unit.factor) };
};
