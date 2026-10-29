import { useCallback, useMemo, useState } from 'react';
import { getLineAmount } from '../../../utils/lineMeasure.js';
import { getUnitSellPrice } from '../../../utils/productUnits.js';
import { createConfirmAddHandler } from '../invoiceItemHandlers.js';
import {
  createAddProductHandler,
  createOpenAddModal,
  createPendingProductChangeHandler,
} from '../invoiceProductHandlers.js';
import { usePendingUnit } from '../productModal/usePendingUnit.js';
import { useInvoiceBarcode } from './useInvoiceBarcode.js';
import { useInvoiceQuickAdd } from './useInvoiceQuickAdd.js';
import { useInvoiceSearchEffects } from './useInvoiceSearchEffects.js';

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
  const [pendingQty, setPendingQty] = useState(0);
  const [pendingPrice, setPendingPrice] = useState(0);
  const [pendingLength, setPendingLength] = useState(null);
  const [pendingWidth, setPendingWidth] = useState(null);

  const getUnitPrice = useCallback(
    (product, unitName) => {
      if (unitName) return getUnitSellPrice(product, unitName);
      return typeof getProductPrice === 'function'
        ? getProductPrice(product)
        : Number(product.sellPriceDefault || 0);
    },
    [getProductPrice]
  );
  const pendingUnit = usePendingUnit({
    pendingProduct,
    getUnitPrice,
    setPendingPrice,
  });

  useInvoiceSearchEffects({ searchKeyword, onSearchProducts, setSearchOpen });
  const barcode = useInvoiceBarcode({
    items,
    setItems,
    products,
    onSearchProducts,
    getUnitPrice,
  });

  const openAddModal = createOpenAddModal({
    setPendingProduct,
    setPendingQty,
    setPendingPrice,
    setPendingLength,
    setPendingWidth,
    setSearchOpen,
    getProductPrice,
    setPendingUnitName: pendingUnit.setUnitName,
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
    setPendingUnitName: pendingUnit.setUnitName,
  });

  const handlePendingPriceChange = useCallback((value) => {
    setPendingPrice(value);
  }, []);

  const updateItem = useCallback(
    (index, field, value) => {
      const nextItems = [...items];
      const nextItem = { ...nextItems[index], [field]: value };
      nextItem.lineTotal = getLineAmount(nextItem);
      nextItems[index] = nextItem;
      setItems(nextItems);
    },
    [items, setItems]
  );

  const pendingPreviousPrice = useMemo(() => {
    if (!pendingProduct?.id) return null;
    const previousPrice = getPreviousProductPrice(
      pendingProduct.id,
      undefined,
      pendingUnit.selection.value
    );
    return Number.isFinite(previousPrice) ? Number(previousPrice) : null;
  }, [getPreviousProductPrice, pendingProduct, pendingUnit.selection.value]);

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

  const { filteredQuick, handleQuickAdd } = useInvoiceQuickAdd({
    activeProducts,
    searchKeyword,
    setSearchKeyword,
    setSearchOpen,
    openAddModal,
    addByCode: barcode.addByCode,
  });

  const confirmAdd = createConfirmAddHandler({
    pendingProduct,
    pendingQty,
    pendingPrice,
    pendingLength,
    pendingWidth,
    pendingUnit: pendingUnit.selection,
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
    unitSelection: pendingUnit.selection,
    barcode,
  };
};
