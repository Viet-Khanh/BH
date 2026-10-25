import { getLineAmount } from './lineMeasure.js';

const SAMPLE_DIMENSIONS = { length: 2.4, width: 1.2 };

const buildSampleItems = (product, dimensions) => {
  if (!product) return [];
  const item = {
    productId: product.id,
    qty: 1,
    unitPrice: product.sellPriceDefault || 50000,
    discount: 0,
    ...(dimensions ? SAMPLE_DIMENSIONS : {}),
  };
  return [{ ...item, lineTotal: getLineAmount(item) }];
};

// Preview data for the invoice template editor.
export const buildSampleInvoice = (
  product,
  { dimensions, now = new Date() }
) => {
  const items = buildSampleItems(product, dimensions);
  return {
    code: 'INV-20240101-001',
    date: now.toISOString(),
    note: 'Ghi chu da luu',
    printNote: 'Luu y chi dung khi in',
    items,
    total: items.reduce((sum, item) => sum + item.lineTotal, 0),
  };
};
