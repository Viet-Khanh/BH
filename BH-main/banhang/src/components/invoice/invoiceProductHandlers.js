export const createOpenAddModal = ({
  setPendingProduct,
  setPendingQty,
  setPendingPrice,
  setPendingLength,
  setPendingWidth,
  setSearchOpen,
}) => (product) => {
  if (!product) return;
  setPendingProduct(product);
  setPendingQty(1);
  setPendingPrice(Number(product.sellPriceDefault || 0));
  setPendingLength(null);
  setPendingWidth(null);
  setSearchOpen(true);
};

export const createAddProductHandler = ({ activeProducts, openAddModal }) => (productId) => {
  const product = activeProducts.find((item) => item.id === productId);
  openAddModal(product);
};

export const createPendingProductChangeHandler = ({
  activeProducts,
  setPendingProduct,
  setPendingQty,
  setPendingPrice,
  setPendingLength,
  setPendingWidth,
}) => (productId) => {
  const product = activeProducts.find((item) => item.id === productId);
  if (!product) return;
  setPendingProduct(product);
  setPendingQty(1);
  setPendingPrice(Number(product.sellPriceDefault || 0));
  setPendingLength(null);
  setPendingWidth(null);
};
