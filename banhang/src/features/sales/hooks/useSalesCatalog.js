import { useCallback, useState } from 'react';
import { v4 as uuid } from 'uuid';
import { createProduct, searchSalesProducts } from '../api/salesApi.js';
import { buildProductPayload, mergeProducts } from '../domain/salesDomain.js';
import { buildCodeFromName } from '../../../pages/Catalog/catalogUtils.js';

export const useSalesCatalog = () => {
  const [products, setProducts] = useState([]);

  const mergeCatalogProducts = useCallback((nextProducts) => {
    if (!Array.isArray(nextProducts) || !nextProducts.length) return;
    setProducts((prev) => mergeProducts(prev, nextProducts));
  }, []);

  const searchProducts = useCallback(
    async (keyword = '') => {
      const data = await searchSalesProducts(keyword, {
        includeDeleted: true,
        limit: 30,
      });

      if (Array.isArray(data)) {
        mergeCatalogProducts(data);
      }
    },
    [mergeCatalogProducts]
  );

  const createCatalogProduct = useCallback(
    async (values) => {
      const payload = buildProductPayload({
        values,
        id: uuid(),
        buildCodeFromName,
      });
      const saved = await createProduct(payload);
      const nextProduct = saved || payload;
      mergeCatalogProducts([nextProduct]);
      return nextProduct;
    },
    [mergeCatalogProducts]
  );

  return {
    products,
    mergeCatalogProducts,
    searchProducts,
    createCatalogProduct,
  };
};
