const getLineTotal = (item, product) => {
  const qty = Number(item.qty || 0);
  const unitCost = Number(item.unitCost || 0);
  let lineTotal = qty * unitCost;
  const length = Number(item.length || 0);
  const width = Number(item.width || 0);
  if (length > 0 && width > 0) {
    lineTotal *= length * width;
  }
  return lineTotal;
};

const usePurchaseItems = ({ items, setItems, products, isEdit }) => {
  const updateItem = (index, field, value) => {
    if (isEdit) return;
    const next = [...items];
    const item = { ...next[index], [field]: value };
    const product = products.find((productItem) => productItem.id === item.productId);
    item.lineTotal = getLineTotal(item, product);
    next[index] = item;
    setItems(next);
  };

  const removeItem = (index) => {
    if (isEdit) return;
    const next = [...items];
    next.splice(index, 1);
    setItems(next);
  };

  return {
    updateItem,
    removeItem,
  };
};

export default usePurchaseItems;
