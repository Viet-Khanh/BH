export const computeStock = (
  productId,
  purchases = [],
  invoices = [],
  products = []
) => {
  const baseStock = Number(
    products.find((item) => item.id === productId)?.openingStock || 0
  );
  const inQty = purchases.reduce((sum, purchase) => {
    if (purchase?.appliedToStock) return sum;
    const qty = (purchase.items || [])
      .filter((item) => item.productId === productId)
      .reduce((acc, item) => acc + Number(item.qty || 0), 0);
    return sum + qty;
  }, 0);

  const outQty = invoices.reduce((sum, invoice) => {
    const qty = (invoice.items || [])
      .filter((item) => item.productId === productId)
      .reduce((acc, item) => acc + Number(item.qty || 0), 0);
    return sum + qty;
  }, 0);

  return baseStock + Number(inQty) - Number(outQty);
};
