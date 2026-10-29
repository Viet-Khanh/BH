import Product from '../models/Product.js';
import { resolveLineUnit } from '../utils/productUnits.js';

const hasUnitName = (item) => Boolean(String(item?.unitName || '').trim());

// Normalizes the unit snapshot of sale lines: lines without a unit name lose
// any stray factor; products are loaded only for lines naming a unit.
export const resolveItemUnits = async (items = []) => {
  const ids = [
    ...new Set(items.filter(hasUnitName).map((item) => item.productId)),
  ];
  const products = ids.length
    ? await Product.find(
        { id: { $in: ids } },
        { id: 1, name: 1, unit: 1, units: 1 }
      ).lean()
    : [];
  const productById = new Map(products.map((product) => [product.id, product]));
  return items.map((item) =>
    item ? resolveLineUnit(item, productById.get(item.productId)) : item
  );
};
