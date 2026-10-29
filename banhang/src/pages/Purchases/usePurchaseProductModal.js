import { useCallback, useEffect, useMemo, useState } from 'react';
import { message } from 'antd';
import { getPurchaseLineTotal } from '../../features/purchases/domain/purchasesDomain.js';
import { usePendingUnit } from '../../components/invoice/productModal/usePendingUnit.js';
import { readDimensions } from '../../utils/lineMeasure.js';
import { getUnitCostPrice } from '../../utils/productUnits.js';
import { hasSearchMatch, normalizeSearchText } from '../../utils/searchText.js';

const usePurchaseProductModal = ({
  activeProducts,
  setItems,
  readOnly = false,
  onSearchProducts,
}) => {
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [pendingProduct, setPendingProduct] = useState(null);
  const [pendingQty, setPendingQty] = useState(1);
  const [pendingPrice, setPendingPrice] = useState(0);
  const [pendingLength, setPendingLength] = useState(null);
  const [pendingWidth, setPendingWidth] = useState(null);
  const pendingUnit = usePendingUnit({
    pendingProduct,
    getUnitPrice: getUnitCostPrice,
    setPendingPrice,
  });
  const setPendingUnitName = pendingUnit.setUnitName;

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key !== 'F2' || readOnly) return;
      event.preventDefault();
      setSearchOpen(true);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [readOnly]);

  useEffect(() => {
    if (!onSearchProducts) return;
    const keyword = searchKeyword.trim();
    if (!keyword) return;
    const timer = setTimeout(() => {
      onSearchProducts(keyword);
    }, 250);
    return () => clearTimeout(timer);
  }, [searchKeyword, onSearchProducts]);

  const openAddModal = (product) => {
    if (!product) return;
    setPendingProduct(product);
    setPendingUnitName('');
    setPendingQty(1);
    setPendingPrice(Number(product.avgCost || 0));
    setPendingLength(null);
    setPendingWidth(null);
    setSearchOpen(true);
  };

  const handleAddProduct = (productId) => {
    if (readOnly) return;
    const product = activeProducts.find((item) => item.id === productId);
    openAddModal(product);
  };

  const handlePendingProductChange = (productId) => {
    const product = activeProducts.find((item) => item.id === productId);
    if (!product) return;
    setPendingProduct(product);
    setPendingUnitName('');
    setPendingQty(1);
    setPendingPrice(Number(product.avgCost || 0));
    setPendingLength(null);
    setPendingWidth(null);
  };

  const filteredQuick = useMemo(() => {
    const key = normalizeSearchText(searchKeyword);
    if (!key) return [];
    return activeProducts
      .filter((item) => hasSearchMatch(item, key))
      .slice(0, 5);
  }, [searchKeyword, activeProducts]);

  const handleQuickAdd = () => {
    if (readOnly) return;
    if (!filteredQuick.length) {
      setSearchOpen(true);
      return;
    }
    openAddModal(filteredQuick[0]);
    setSearchKeyword('');
  };

  const handleConfirmAdd = ({ closeAfter = false } = {}) => {
    if (readOnly) return false;
    if (!pendingProduct) return false;
    const qty = Number(pendingQty || 0);
    const unitCost = Number(pendingPrice || 0);

    const dimensions = readDimensions(pendingLength, pendingWidth);
    if (dimensions.error) {
      message.error(dimensions.error);
      return false;
    }

    const lineTotal = getPurchaseLineTotal({ qty, unitCost, ...dimensions });

    setItems((prev) => [
      ...prev,
      {
        productId: pendingProduct.id,
        qty,
        unitCost,
        lineTotal,
        lineNote: '',
        length: dimensions.length,
        width: dimensions.width,
        ...(pendingUnit.selection.value
          ? {
              unitName: pendingUnit.selection.value,
              factor: pendingUnit.selection.factor,
            }
          : {}),
      },
    ]);

    if (closeAfter) {
      setSearchOpen(false);
    } else {
      setPendingQty(1);
      setPendingLength(null);
      setPendingWidth(null);
    }
    return true;
  };

  const resetSearchState = useCallback(() => {
    setSearchOpen(false);
    setSearchKeyword('');
    setPendingProduct(null);
    setPendingQty(1);
    setPendingPrice(0);
    setPendingLength(null);
    setPendingWidth(null);
    setPendingUnitName('');
  }, [setPendingUnitName]);

  return {
    searchOpen,
    setSearchOpen,
    searchKeyword,
    setSearchKeyword,
    pendingProduct,
    pendingQty,
    pendingPrice,
    pendingLength,
    pendingWidth,
    setPendingQty,
    setPendingPrice,
    setPendingLength,
    setPendingWidth,
    handleAddProduct,
    handlePendingProductChange,
    handleConfirmAdd,
    filteredQuick,
    handleQuickAdd,
    resetSearchState,
    unitSelection: pendingUnit.selection,
  };
};

export default usePurchaseProductModal;
