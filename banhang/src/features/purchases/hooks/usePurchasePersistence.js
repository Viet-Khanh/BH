import { useCallback } from 'react';
import { message } from 'antd';
import { v4 as uuid } from 'uuid';
import { createPurchase, updatePurchase } from '../api/purchasesApi.js';
import {
  buildPurchasePayload,
  normalizePurchaseItems,
} from '../domain/purchasesDomain.js';

export const usePurchasePersistence = ({
  code,
  date,
  supplierId,
  items,
  note,
  editing,
  isEdit,
  isFullEdit,
  setEditing,
  mergeCatalogProducts,
}) => {
  const persistPurchase = useCallback(async () => {
    if (isEdit && !isFullEdit) return editing;
    if (!supplierId) {
      message.error('Chọn nhà cung cấp.');
      return null;
    }
    if (!items.length) {
      message.error('Chọn hàng hóa.');
      return null;
    }

    const normalizedItems = normalizePurchaseItems(items);

    if (isEdit && isFullEdit && editing?.id) {
      const payload = buildPurchasePayload({
        code,
        supplierId,
        date,
        items: normalizedItems,
        note,
      });

      try {
        const data = await updatePurchase(editing.id, payload);
        if (Array.isArray(data?.products)) {
          mergeCatalogProducts(data.products);
        }
        const nextPurchase = data?.purchase || { ...payload, id: editing.id };
        setEditing(nextPurchase);
        message.success('Đã cập nhật phiếu nhập.');
        return nextPurchase;
      } catch (error) {
        message.error('Không thể cập nhật phiếu nhập.');
        return null;
      }
    }

    const purchasePayload = buildPurchasePayload({
      id: uuid(),
      code,
      supplierId,
      date,
      note,
      items: normalizedItems,
    });

    try {
      const data = await createPurchase(purchasePayload);
      if (Array.isArray(data?.products)) {
        mergeCatalogProducts(data.products);
      }
      return data?.purchase || purchasePayload;
    } catch (error) {
      message.error('Không thể lưu phiếu nhập.');
      return null;
    }
  }, [
    code,
    date,
    editing,
    isEdit,
    isFullEdit,
    items,
    mergeCatalogProducts,
    note,
    setEditing,
    supplierId,
  ]);

  return {
    persistPurchase,
  };
};
