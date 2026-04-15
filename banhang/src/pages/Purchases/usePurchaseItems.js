import { getPurchaseLineTotal } from '../../features/purchases/domain/purchasesDomain.js';

const usePurchaseItems = ({ items, setItems, products, readOnly = false }) => {
  const updateItem = (index, field, value) => {
    if (readOnly) return;
    const next = [...items];
    const item = { ...next[index], [field]: value };
    item.lineTotal = getPurchaseLineTotal(item);
    next[index] = item;
    setItems(next);
  };

  const removeItem = (index) => {
    if (readOnly) return;
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
