// Length × width (Dài × Rộng) helpers. Items without both dimensions behave as a
// plain quantity, so formulas need no edition check: editions without the
// dimensions feature simply never set them.
export const normalizeDimension = (value) => {
  const number = Number(value || 0);
  return number > 0 ? number : null;
};

export const hasDimensions = (item = {}) =>
  Boolean(normalizeDimension(item.length) && normalizeDimension(item.width));

export const getAreaMultiplier = (item = {}) =>
  hasDimensions(item) ? Number(item.length) * Number(item.width) : 1;

export const getMeasuredQty = (item = {}) =>
  Number(item.qty || 0) * getAreaMultiplier(item);

export const getLineAmount = (item = {}, priceField = 'unitPrice') =>
  Number(item.qty || 0) *
  Number(item[priceField] || 0) *
  getAreaMultiplier(item);

// Both dimensions or neither. Returns normalized values and a user-facing error.
export const readDimensions = (length, width) => {
  const normalized = {
    length: normalizeDimension(length),
    width: normalizeDimension(width),
  };
  const error =
    Boolean(normalized.length) === Boolean(normalized.width)
      ? null
      : 'Vui lòng nhập đủ chiều dài và chiều rộng.';
  return { ...normalized, error };
};
