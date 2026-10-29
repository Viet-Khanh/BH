import Product from '../models/Product.js';
import { resolveLineUnit } from '../utils/productUnits.js';

// Normalizes the unit snapshot of sale lines; only loads products when a line has a unit.
export const resolveItemUnits = async (items = []) => {
  const ids = [
    ...new Set(
      items.filter((item) => item?.unitName).map((item) => item.productId)
    ),
  ];
  if (!ids.length) return items;
  const products = await Product.find(
    { id: { $in: ids } },
    { id: 1, name: 1, unit: 1, units: 1 }
  ).lean();
  const productById = new Map(products.map((product) => [product.id, product]));
  return items.map((item) =>
    item?.unitName
      ? resolveLineUnit(item, productById.get(item.productId))
      : item
  );
};
