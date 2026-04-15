export const createOpenAddModal =
  ({
    setPendingProduct,
    setPendingQty,
    setPendingPrice,
    setPendingLength,
    setPendingWidth,
    setSearchOpen,
    getProductPrice,
  }) =>
  (product) => {
    if (!product) return;
    const nextPrice =
      typeof getProductPrice === 'function'
        ? getProductPrice(product)
        : Number(product.sellPriceDefault || 0);
    setPendingProduct(product);
    setPendingQty(1);
    setPendingPrice(nextPrice);
    setPendingLength(null);
    setPendingWidth(null);
    setSearchOpen(true);
  };

export const createAddProductHandler =
  ({ activeProducts, openAddModal }) =>
  (productId) => {
    const product = activeProducts.find((item) => item.id === productId);
    openAddModal(product);
  };

export const createPendingProductChangeHandler =
  ({
    activeProducts,
    setPendingProduct,
    setPendingQty,
    setPendingPrice,
    setPendingLength,
    setPendingWidth,
    getProductPrice,
  }) =>
  (productId) => {
    const product = activeProducts.find((item) => item.id === productId);
    if (!product) return;
    const nextPrice =
      typeof getProductPrice === 'function'
        ? getProductPrice(product)
        : Number(product.sellPriceDefault || 0);
    setPendingProduct(product);
    setPendingQty(1);
    setPendingPrice(nextPrice);
    setPendingLength(null);
    setPendingWidth(null);
  };
