import { message } from 'antd';
import { getLineAmount, readDimensions } from '../../utils/lineMeasure.js';

export const createConfirmAddHandler =
  ({
    pendingProduct,
    pendingQty,
    pendingPrice,
    pendingLength,
    pendingWidth,
    pendingUnit,
    setItems,
    setSearchOpen,
    setPendingQty,
    setPendingLength,
    setPendingWidth,
  }) =>
  ({ closeAfter = false } = {}) => {
    if (!pendingProduct) return false;
    const qty = Number(pendingQty || 0);
    const unitPrice = Number(pendingPrice || 0);
    if (unitPrice < 0) {
      message.error('Đơn giá >= 0.');
      return false;
    }

    const dimensions = readDimensions(pendingLength, pendingWidth);
    if (dimensions.error) {
      message.error(dimensions.error);
      return false;
    }

    const newItem = {
      productId: pendingProduct.id,
      qty,
      unitPrice,
      lineTotal: getLineAmount({ qty, unitPrice, ...dimensions }),
      costPriceSnapshot: Number(pendingProduct.avgCost || 0),
      excludeFromProfitSnapshot: Boolean(pendingProduct.excludeFromProfit),
      lineNote: '',
      length: dimensions.length,
      width: dimensions.width,
      ...(pendingUnit?.value
        ? { unitName: pendingUnit.value, factor: pendingUnit.factor }
        : {}),
    };
    setItems((prev) => [...prev, newItem]);
    if (closeAfter) {
      setSearchOpen(false);
    } else {
      setPendingQty(0);
      setPendingLength(null);
      setPendingWidth(null);
    }
    return true;
  };
