import { useCallback, useEffect, useMemo, useState } from 'react';
import { message } from 'antd';
import { hasSearchMatch, normalizeSearchText } from '../../utils/searchText.js';

const getValidDimension = (value) => {
  const numeric = Number(value || 0);
  return numeric > 0 ? numeric : null;
};

const getLineTotal = ({ qty, unitCost, length, width }) => {
  let total = Number(qty || 0) * Number(unitCost || 0);
  const lengthValue = Number(length || 0);
  const widthValue = Number(width || 0);
  if (lengthValue > 0 && widthValue > 0) {
    total *= lengthValue * widthValue;
  }
  return total;
};

const usePurchaseProductModal = ({ activeProducts, setItems, readOnly = false, onSearchProducts }) => {
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [pendingProduct, setPendingProduct] = useState(null);
  const [pendingQty, setPendingQty] = useState(1);
  const [pendingPrice, setPendingPrice] = useState(0);
  const [pendingLength, setPendingLength] = useState(null);
  const [pendingWidth, setPendingWidth] = useState(null);

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
    setPendingQty(1);
    setPendingPrice(Number(product.avgCost || 0));
    setPendingLength(null);
    setPendingWidth(null);
  };

  const filteredQuick = useMemo(() => {
    const key = normalizeSearchText(searchKeyword);
    if (!key) return [];
    return activeProducts.filter((item) => hasSearchMatch(item, key)).slice(0, 5);
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
    if (qty === 0) {
      message.error('Số lượng khác 0.');
      return false;
    }
    if (unitCost < 0) {
      message.error('Đơn giá >= 0.');
      return false;
    }

    const lengthValue = getValidDimension(pendingLength);
    const widthValue = getValidDimension(pendingWidth);
    if ((lengthValue && !widthValue) || (!lengthValue && widthValue)) {
      message.error('Vui lòng nhập đủ chiều dài và chiều rộng.');
      return false;
    }

    const lineTotal = getLineTotal({ qty, unitCost, length: lengthValue, width: widthValue });

    setItems((prev) => [
      ...prev,
      {
        productId: pendingProduct.id,
        qty,
        unitCost,
        lineTotal,
        lineNote: '',
        length: lengthValue,
        width: widthValue,
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
  }, []);

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
  };
};

export default usePurchaseProductModal;
