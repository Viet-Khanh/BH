import {
  findProductUnit,
  getBaseQty,
  getUnitSellPrice,
} from '../../../utils/productUnits.js';
import { BARCODE_TOO_LONG_WARNING, isBarcodeTooLong } from './barcodeLayout.js';

export const NO_UNIT_BARCODE_WARNING =
  'Đơn vị chưa có mã vạch — tem không có mã vạch.';

const clean = (value) => String(value ?? '').trim();

// 13 digits with a valid EAN-13 check digit.
export const isValidEan13 = (value) => {
  const code = clean(value);
  if (!/^\d{13}$/.test(code)) return false;
  const sum = [...code.slice(0, 12)].reduce(
    (acc, digit, index) => acc + Number(digit) * (index % 2 ? 3 : 1),
    0
  );
  return (10 - (sum % 10)) % 10 === Number(code[12]);
};

export const getBarcodeFormat = (barcode) =>
  isValidEan13(barcode) ? 'EAN13' : 'CODE128';

// Barcode rule: base unit → product barcode or code; packaging unit → its own barcode only.
const readBarcode = (product, unit) => {
  if (unit) {
    const barcode = clean(unit.barcode);
    return {
      barcode,
      hasOwnBarcode: Boolean(barcode),
      warning: barcode ? '' : NO_UNIT_BARCODE_WARNING,
    };
  }
  const own = clean(product?.barcode);
  return {
    barcode: own || clean(product?.code),
    hasOwnBarcode: Boolean(own),
    warning: '',
  };
};

const toCount = (value) => Math.max(0, Math.ceil(Number(value) || 0));

const getLengthWarning = (barcode, format, labelWidthMm) =>
  barcode && labelWidthMm && isBarcodeTooLong(barcode, format, labelWidthMm)
    ? BARCODE_TOO_LONG_WARNING
    : '';

// One label row; without a count it is derived from baseCount (unit switch).
// `labelWidthMm` enables the "too long to scan" warning.
export const buildLabelRow = (
  product,
  unitName = '',
  count,
  baseCount,
  { labelWidthMm } = {}
) => {
  const unit = findProductUnit(product, unitName);
  const factor = unit ? Number(unit.factor) || 1 : 1;
  const hasCount = count !== undefined && count !== null;
  const base = baseCount ?? (hasCount ? Number(count) * factor : 0);
  const { barcode, hasOwnBarcode, warning } = readBarcode(product, unit);
  const barcodeFormat = getBarcodeFormat(barcode);
  return {
    key: `${product?.id}::${unit ? unit.name : ''}`,
    productId: product?.id,
    name: product?.name || '',
    unitName: unit ? unit.name : '',
    unitLabel: unit ? unit.name : product?.unit || '',
    count: hasCount ? toCount(count) : toCount(base / factor),
    baseCount: base,
    price: getUnitSellPrice(product, unit ? unit.name : ''),
    barcode,
    barcodeFormat,
    warning: warning || getLengthWarning(barcode, barcodeFormat, labelWidthMm),
    hasOwnBarcode,
  };
};

// Purchase lines → one base-unit label row per product, in line order.
export const buildLabelJobs = ({
  items = [],
  products = [],
  skipWithBarcode = true,
  labelWidthMm,
} = {}) => {
  const byId = new Map(products.map((product) => [product.id, product]));
  const totals = new Map();
  items.forEach((item) => {
    if (!byId.has(item?.productId)) return;
    const previous = totals.get(item.productId) || 0;
    totals.set(item.productId, previous + getBaseQty(item));
  });
  return [...totals.entries()]
    .map(([productId, baseCount]) =>
      buildLabelRow(byId.get(productId), '', undefined, baseCount, {
        labelWidthMm,
      })
    )
    .filter((row) => !(skipWithBarcode && row.hasOwnBarcode));
};
