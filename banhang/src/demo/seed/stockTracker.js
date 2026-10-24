// Tracks stock while generating sales so the backend never rejects an invoice.
export const createStockTracker = (products) => {
  const levels = new Map(
    products.map((product) => [product.id, Number(product.openingStock || 0)])
  );
  const level = (productId) => levels.get(productId) || 0;
  return {
    available: level,
    add: (productId, qty) => levels.set(productId, level(productId) + qty),
    take: (productId, qty) => levels.set(productId, level(productId) - qty),
    inStock: () => products.filter((product) => level(product.id) > 0),
  };
};
