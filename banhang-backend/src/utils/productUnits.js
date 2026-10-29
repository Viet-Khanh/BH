// Packaging units (thùng, lốc…) over a product's base unit. Stock, cost and
// profit are always computed in base units: base qty = qty × factor.
export const MAX_PRODUCT_UNITS = 5;

export const getItemFactor = (item = {}) => {
  const factor = Number(item?.factor);
  return Number.isFinite(factor) && factor > 0 ? factor : 1;
};

export const getBaseQty = (item = {}) =>
  Number(item?.qty || 0) * getItemFactor(item);

const toKey = (name) =>
  String(name || '')
    .trim()
    .toLowerCase();

const sameName = (a, b) => toKey(a) === toKey(b);

const isBlank = (value) =>
  value === null || value === undefined || String(value).trim() === '';

const toPrice = (value) => (isBlank(value) ? null : Number(value));

// User-facing validation error, answered with HTTP 400 (backend and demo).
export const unitError = (message) =>
  Object.assign(new Error(message), { status: 400 });

const isEmptyUnitRow = (unit) =>
  isBlank(unit?.name) && isBlank(unit?.factor) && isBlank(unit?.sellPrice);

const findUnitError = (units, baseUnit) => {
  if (units.length > MAX_PRODUCT_UNITS) {
    return `Tối đa ${MAX_PRODUCT_UNITS} đơn vị quy đổi.`;
  }
  for (const [index, unit] of units.entries()) {
    if (!unit.name) return 'Đơn vị quy đổi thiếu tên.';
    if (sameName(unit.name, baseUnit)) {
      return `Đơn vị quy đổi "${unit.name}" trùng đơn vị cơ bản.`;
    }
    if (
      units.slice(0, index).some((other) => sameName(other.name, unit.name))
    ) {
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
    .filter((unit) => !isEmptyUnitRow(unit))
    .map((unit) => ({
      name: String(unit.name ?? '').trim(),
      factor: Number(unit.factor),
      sellPrice: toPrice(unit.sellPrice),
    }));
  return { units, error: findUnitError(units, baseUnit) };
};

const toFactor = (value) => {
  const factor = Number(value);
  return Number.isFinite(factor) && factor > 0 ? factor : null;
};

// Normalizes the unit of one invoice/purchase line against its product.
// Base-unit lines carry no unit fields (same shape as before units existed).
// Without a product only a valid snapshot is kept (missing products are
// reported by the caller's own validation).
export const resolveLineUnit = (item, product) => {
  const { unitName, factor, ...rest } = item;
  const name = String(unitName || '').trim();
  const snapshot = toFactor(factor);
  if (!name) return rest;
  const keepSnapshot = { ...rest, unitName: name, factor: snapshot };
  if (!product) return snapshot ? keepSnapshot : rest;
  // A base-unit name with a factor > 1 is an old line whose base unit was renamed.
  const isBaseUnit = sameName(name, product.unit);
  if (isBaseUnit && (!snapshot || snapshot === 1)) return rest;
  if (snapshot) return keepSnapshot;
  const unit = (product.units || []).find((entry) =>
    sameName(entry.name, name)
  );
  if (!unit) {
    throw unitError(
      `Đơn vị "${name}" không có trong hàng ${product.name || ''}.`
    );
  }
  return { ...rest, unitName: unit.name, factor: Number(unit.factor) };
};
