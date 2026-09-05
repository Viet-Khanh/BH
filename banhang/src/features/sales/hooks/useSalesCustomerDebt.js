import { useCallback, useRef, useState } from 'react';
import { getCustomerDebt } from '../api/salesApi.js';

export const useSalesCustomerDebt = () => {
  const [customerDebt, setCustomerDebtState] = useState(0);
  const latestRequestRef = useRef(0);
  const customerDebtRef = useRef(0);

  const commitCustomerDebt = useCallback((value) => {
    const nextDebt = Number(value || 0);
    customerDebtRef.current = nextDebt;
    setCustomerDebtState(nextDebt);
    return nextDebt;
  }, []);

  const setCustomerDebt = useCallback(
    (value) => {
      latestRequestRef.current += 1;
      return commitCustomerDebt(value);
    },
    [commitCustomerDebt]
  );

  const refreshCustomerDebt = useCallback(
    async (customerId, excludeInvoiceId, asOfDate) => {
      const requestId = latestRequestRef.current + 1;
      latestRequestRef.current = requestId;

      if (!customerId) {
        return commitCustomerDebt(0);
      }

      try {
        const data = await getCustomerDebt({
          customerId,
          excludeInvoiceId,
          asOfDate,
        });
        const nextDebt = Number(data?.debt || 0);
        if (latestRequestRef.current === requestId) {
          commitCustomerDebt(nextDebt);
        }
        return nextDebt;
      } catch (error) {
        if (latestRequestRef.current !== requestId) {
          return customerDebtRef.current;
        }
        throw error;
      }
    },
    [commitCustomerDebt]
  );

  return {
    customerDebt,
    setCustomerDebt,
    refreshCustomerDebt,
  };
};
