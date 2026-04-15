import { useCallback, useEffect, useState } from 'react';
import { message } from 'antd';
import { getSupplierDebt } from '../api/purchasesApi.js';

export const usePurchaseDebtState = ({ supplierId, excludePurchaseId }) => {
  const [supplierDebt, setSupplierDebt] = useState(0);

  const refreshSupplierDebt = useCallback(
    async ({ nextSupplierId = supplierId, silent = false } = {}) => {
      if (!nextSupplierId) {
        setSupplierDebt(0);
        return 0;
      }

      try {
        const data = await getSupplierDebt({
          supplierId: nextSupplierId,
          excludePurchaseId,
        });
        const nextDebt = Number(data?.debt || 0);
        setSupplierDebt(nextDebt);
        return nextDebt;
      } catch (error) {
        setSupplierDebt(0);
        if (!silent) {
          message.error('Không thể tải công nợ nhà cung cấp.');
        }
        throw error;
      }
    },
    [excludePurchaseId, supplierId]
  );

  useEffect(() => {
    refreshSupplierDebt({ silent: false }).catch(() => {});
  }, [refreshSupplierDebt]);

  return {
    supplierDebt,
    setSupplierDebt,
    refreshSupplierDebt,
  };
};
