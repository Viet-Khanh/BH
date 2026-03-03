import { message } from 'antd';

const getValidDimension = (value) => {
  const numeric = Number(value || 0);
  return numeric > 0 ? numeric : null;
};

export const createConfirmAddHandler = ({
  pendingProduct,
  pendingQty,
  pendingPrice,
  pendingLength,
  pendingWidth,
  setItems,
  setSearchOpen,
  setPendingQty,
  setPendingLength,
  setPendingWidth,
}) => ({ closeAfter = false } = {}) => {
  if (!pendingProduct) return false;
  const qty = Number(pendingQty || 0);
  const unitPrice = Number(pendingPrice || 0);
  if (unitPrice < 0) {
    message.error('Đơn giá >= 0.');
    return false;
  }

  const lengthValue = getValidDimension(pendingLength);
  const widthValue = getValidDimension(pendingWidth);
  if ((lengthValue && !widthValue) || (!lengthValue && widthValue)) {
    message.error('Vui lòng nhập đủ chiều dài và chiều rộng.');
    return false;
  }

  let lineTotal = qty * unitPrice;
  if (lengthValue && widthValue) {
    lineTotal *= lengthValue * widthValue;
  }
  const newItem = {
    productId: pendingProduct.id,
    qty,
    unitPrice,
    lineTotal,
    costPriceSnapshot: Number(pendingProduct.avgCost || 0),
    lineNote: '',
    length: lengthValue,
    width: widthValue,
  };
  setItems((prev) => [...prev, newItem]);
  if (closeAfter) {
    setSearchOpen(false);
  } else {
    setPendingQty(1);
    setPendingLength(null);
    setPendingWidth(null);
  }
  return true;
};
