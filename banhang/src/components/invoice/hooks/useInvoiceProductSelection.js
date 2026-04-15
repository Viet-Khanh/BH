import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  hasSearchMatch,
  normalizeSearchText,
} from '../../../utils/searchText.js';
import { getLineBase } from '../invoiceUtils.js';
import { createConfirmAddHandler } from '../invoiceItemHandlers.js';
import {
  createAddProductHandler,
  createOpenAddModal,
  createPendingProductChangeHandler,
} from '../invoiceProductHandlers.js';

export const useInvoiceProductSelection = ({
  items,
  setItems,
  products = [],
  activeProducts = [],
  onSearchProducts,
  getProductPrice,
  getPreviousProductPrice,
}) => {
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [pendingProduct, setPendingProduct] = useState(null);
  const [pendingQty, setPendingQty] = useState(1);
  const [pendingPrice, setPendingPrice] = useState(0);
  const [pendingLength, setPendingLength] = useState(null);
  const [pendingWidth, setPendingWidth] = useState(null);

  useEffect(() => {
    if (!onSearchProducts) return;
    const keyword = searchKeyword.trim();
    if (!keyword) return;

    const timer = setTimeout(() => {
      onSearchProducts(keyword);
    }, 250);

    return () => clearTimeout(timer);
  }, [onSearchProducts, searchKeyword]);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key !== 'F2') return;
      event.preventDefault();
      setSearchOpen(true);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const openAddModal = createOpenAddModal({
    setPendingProduct,
    setPendingQty,
    setPendingPrice,
    setPendingLength,
    setPendingWidth,
    setSearchOpen,
    getProductPrice,
  });

  const handleProductCreated = useCallback(
    (product) => {
      openAddModal(product);
    },
    [openAddModal]
  );

  const handleAddProduct = createAddProductHandler({
    activeProducts,
    openAddModal,
  });

  const handlePendingProductChange = createPendingProductChangeHandler({
    activeProducts,
    setPendingProduct,
    setPendingQty,
    setPendingPrice,
    setPendingLength,
    setPendingWidth,
    getProductPrice,
  });

  const handlePendingPriceChange = useCallback((value) => {
    setPendingPrice(value);
  }, []);

  const updateItem = useCallback(
    (index, field, value) => {
      const nextItems = [...items];
      const nextItem = { ...nextItems[index], [field]: value };
      const product = products.find(
        (currentProduct) => currentProduct.id === nextItem.productId
      );
      nextItem.lineTotal = getLineBase(nextItem, product);
      nextItems[index] = nextItem;
      setItems(nextItems);
    },
    [items, products, setItems]
  );

  const pendingPreviousPrice = useMemo(() => {
    if (!pendingProduct?.id) return null;
    const previousPrice = getPreviousProductPrice(pendingProduct.id);
    return Number.isFinite(previousPrice) ? Number(previousPrice) : null;
  }, [getPreviousProductPrice, pendingProduct]);

  const applyPendingPreviousPrice = useCallback(() => {
    if (!Number.isFinite(pendingPreviousPrice)) return;
    setPendingPrice(Number(pendingPreviousPrice));
  }, [pendingPreviousPrice]);

  const removeItem = useCallback(
    (index) => {
      const nextItems = [...items];
      nextItems.splice(index, 1);
      setItems(nextItems);
    },
    [items, setItems]
  );

  const filteredQuick = useMemo(() => {
    const keyword = normalizeSearchText(searchKeyword);
    if (!keyword) return [];
    return activeProducts
      .filter((item) => hasSearchMatch(item, keyword))
      .slice(0, 5);
  }, [activeProducts, searchKeyword]);

  const handleQuickAdd = useCallback(() => {
    if (!filteredQuick.length) {
      setSearchOpen(true);
      return;
    }

    openAddModal(filteredQuick[0]);
    setSearchKeyword('');
  }, [filteredQuick, openAddModal]);

  const confirmAdd = createConfirmAddHandler({
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
  });

  const handleConfirmAdd = useCallback(
    (options) => {
      return confirmAdd(options);
    },
    [confirmAdd]
  );

  return {
    searchOpen,
    setSearchOpen,
    searchKeyword,
    setSearchKeyword,
    pendingProduct,
    setPendingProduct,
    pendingQty,
    setPendingQty,
    pendingPrice,
    setPendingPrice: handlePendingPriceChange,
    pendingLength,
    setPendingLength,
    pendingWidth,
    setPendingWidth,
    handleProductCreated,
    handleAddProduct,
    handlePendingProductChange,
    updateItem,
    pendingPreviousPrice,
    applyPendingPreviousPrice,
    removeItem,
    filteredQuick,
    handleQuickAdd,
    handleConfirmAdd,
  };
};
