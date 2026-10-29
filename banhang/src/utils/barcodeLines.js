import { getLineAmount } from './lineMeasure.js';
import {
  buildLineUnitFields,
  findProductUnit,
  getUnitOptions,
} from './productUnits.js';

const clean = (value) => String(value ?? '').trim();

// Exact match of a scanned/typed code: product or unit barcode first, then product code.
export const findBarcodeMatch = (products = [], rawCode) => {
  const code = clean(rawCode);
  if (!code) return null;
  for (const product of products) {
    if (clean(product?.barcode) === code) return { product, unitName: '' };
    const unit = (product?.units || []).find(
      (entry) => clean(entry?.barcode) === code
    );
    if (unit) return { product, unitName: unit.name };
  }
  const byCode = products.find((product) => clean(product?.code) === code);
  return byCode ? { product: byCode, unitName: '' } : null;
};

const hasDimensions = (item) => Boolean(item?.length) || Boolean(item?.width);
const sameLine = (a, b) =>
  a.productId === b.productId &&
  (a.unitName || '') === (b.unitName || '') &&
  !hasDimensions(a) &&
  !hasDimensions(b);

const withTotal = (item, priceField) => ({
  ...item,
  lineTotal: getLineAmount(item, priceField),
});

// Scanning the same product+unit again adds its qty to the existing line.
export const mergeScannedLine = (items = [], line, priceField) => {
  const index = items.findIndex((item) => sameLine(item, line));
  if (index < 0) return [...items, withTotal(line, priceField)];
  return items.map((item, position) =>
    position === index
      ? withTotal(
          { ...item, qty: Number(item.qty || 0) + Number(line.qty || 0) },
          priceField
        )
      : item
  );
};

export const switchLineUnit = (item, product, unitName, price, priceField) => {
  const { unitName: _oldName, factor: _oldFactor, ...rest } = item;
  const unit = findProductUnit(product, unitName);
  const selection = {
    value: unit ? unit.name : '',
    factor: unit ? Number(unit.factor) : 1,
  };
  return withTotal(
    {
      ...rest,
      [priceField]: Number(price || 0),
      ...buildLineUnitFields(selection),
    },
    priceField
  );
};

export const nextUnitName = (product, unitName = '') => {
  const values = getUnitOptions(product).map((option) => option.value);
  const index = values.indexOf(unitName || '');
  return values[(index + 1) % values.length] || '';
};
