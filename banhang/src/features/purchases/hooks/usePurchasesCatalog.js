import { useCallback, useMemo, useState } from 'react';
import { message } from 'antd';
import { guardProductSearch } from '../../../utils/guardProductSearch.js';
import { searchPurchaseProducts } from '../api/purchasesApi.js';
import { mergeProducts } from '../domain/purchasesDomain.js';

const showSearchError = () =>
  message.error('Không thể tải danh sách sản phẩm.');

export const usePurchasesCatalog = () => {
  const [products, setProducts] = useState([]);

  const mergeCatalogProducts = useCallback((nextProducts) => {
    if (!Array.isArray(nextProducts) || !nextProducts.length) return;
    setProducts((prev) => mergeProducts(prev, nextProducts));
  }, []);

  const fetchProducts = useCallback(
    async (keyword = '') => {
      const data = await searchPurchaseProducts(keyword, { limit: 30 });
      if (!Array.isArray(data)) return [];
      mergeCatalogProducts(data);
      return data;
    },
    [mergeCatalogProducts]
  );
  // Typing: error message + []; scans pass { throwOnError: true } to show the real error.
  const searchProducts = useMemo(
    () => guardProductSearch(fetchProducts, showSearchError),
    [fetchProducts]
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
