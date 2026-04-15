import { useCallback, useState } from 'react';
import { getCustomerDebt } from '../api/salesApi.js';

export const useSalesCustomerDebt = () => {
  const [customerDebt, setCustomerDebt] = useState(0);

  const refreshCustomerDebt = useCallback(
    async (customerId, excludeInvoiceId, asOfDate) => {
      if (!customerId) {
        setCustomerDebt(0);
        return 0;
      }

      const data = await getCustomerDebt({
        customerId,
        excludeInvoiceId,
        asOfDate,
      });
      const nextDebt = Number(data?.debt || 0);
      setCustomerDebt(nextDebt);
      return nextDebt;
    },
    []
  );

  return {
    customerDebt,
    setCustomerDebt,
    refreshCustomerDebt,
  };
};
