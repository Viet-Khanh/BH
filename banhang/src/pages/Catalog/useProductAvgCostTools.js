import { useCallback, useMemo, useState } from 'react';
import { message } from 'antd';

const asNumber = (value) => Number(value || 0);

const hasRetailPriceEqualCost = (product) =>
  asNumber(product.sellPriceDefault) === asNumber(product.avgCost);

const needsAvgCostFromRetailPrice = (product) =>
  asNumber(product.avgCost) <= 0 && asNumber(product.sellPriceDefault) > 0;

const useProductAvgCostTools = ({
  activeProducts,
  showSensitiveInfo,
  bulkFillMissingAvgCostFromRetail,
}) => {
  const [productCostFilterActive, setProductCostFilterActive] =
    useState(false);
  const [avgCostPreviewOpen, setAvgCostPreviewOpen] = useState(false);
  const [avgCostUpdating, setAvgCostUpdating] = useState(false);

  const productsMissingAvgCost = useMemo(
    () => activeProducts.filter(needsAvgCostFromRetailPrice),
    [activeProducts]
  );

  const priceCostMatchedCount = useMemo(
    () => activeProducts.filter(hasRetailPriceEqualCost).length,
    [activeProducts]
  );

  const applyProductCostFilter = useCallback(
    (products) => {
      if (!showSensitiveInfo || !productCostFilterActive) return products;
      return products.filter(hasRetailPriceEqualCost);
    },
    [productCostFilterActive, showSensitiveInfo]
  );

  const toggleProductCostFilter = useCallback(() => {
    setProductCostFilterActive((value) => !value);
  }, []);

  const resetProductCostFilter = useCallback(() => {
    setProductCostFilterActive(false);
  }, []);

  const openAvgCostPreview = useCallback(() => {
    if (!productsMissingAvgCost.length) {
      message.info('Không có sản phẩm cần cập nhật Giá vốn.');
      return;
    }
    setAvgCostPreviewOpen(true);
  }, [productsMissingAvgCost.length]);

  const closeAvgCostPreview = useCallback(() => {
    setAvgCostPreviewOpen(false);
  }, []);

  const confirmAvgCostUpdate = useCallback(async () => {
    setAvgCostUpdating(true);
    try {
      const result = await bulkFillMissingAvgCostFromRetail(
        productsMissingAvgCost.map((product) => product.id)
      );
      message.success(
        `Đã cập nhật Giá vốn cho ${Number(result?.updatedCount || 0)} sản phẩm.`
      );
      setAvgCostPreviewOpen(false);
    } catch (error) {
      message.error(error.message || 'Không thể cập nhật Giá vốn.');
    } finally {
      setAvgCostUpdating(false);
    }
  }, [bulkFillMissingAvgCostFromRetail, productsMissingAvgCost]);

  return {
    productCostFilterActive,
    productsMissingAvgCost,
    priceCostMatchedCount,
    missingAvgCostCount: productsMissingAvgCost.length,
    avgCostPreviewOpen,
    avgCostUpdating,
    applyProductCostFilter,
    toggleProductCostFilter,
    resetProductCostFilter,
    openAvgCostPreview,
    closeAvgCostPreview,
    confirmAvgCostUpdate,
  };
};

export default useProductAvgCostTools;
