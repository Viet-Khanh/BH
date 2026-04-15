import { useCallback, useMemo, useState } from 'react';
import { searchPurchaseProducts } from '../api/purchasesApi.js';
import { mergeProducts } from '../domain/purchasesDomain.js';

export const usePurchasesCatalog = () => {
  const [products, setProducts] = useState([]);

  const mergeCatalogProducts = useCallback((nextProducts) => {
    if (!Array.isArray(nextProducts) || !nextProducts.length) return;
    setProducts((prev) => mergeProducts(prev, nextProducts));
  }, []);

  const searchProducts = useCallback(
    async (keyword = '') => {
      const data = await searchPurchaseProducts(keyword, { limit: 30 });
      if (Array.isArray(data)) {
        mergeCatalogProducts(data);
      }
    },
    [mergeCatalogProducts]
  );

  const activeProducts = useMemo(
    () => products.filter((item) => !item.isDeleted),
    [products]
  );

  return {
    products,
    activeProducts,
    mergeCatalogProducts,
    searchProducts,
  };
};
