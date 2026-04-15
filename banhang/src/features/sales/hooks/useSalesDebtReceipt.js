import { useCallback, useState } from 'react';

export const useSalesDebtReceipt = ({ editingRef, refreshCustomerDebt }) => {
  const [open, setOpen] = useState(false);
  const [customerId, setCustomerId] = useState('');

  const openModal = useCallback(() => {
    setCustomerId(editingRef.current?.customerId || '');
    setOpen(true);
  }, [editingRef]);

  const handleSuccess = useCallback(
    (paidCustomerId) => {
      if (editingRef.current?.customerId === paidCustomerId) {
        refreshCustomerDebt(
          paidCustomerId,
          editingRef.current?.id || null
        ).catch(() => {});
      }
    },
    [editingRef, refreshCustomerDebt]
  );

  return {
    open,
    setOpen,
    customerId,
    openModal,
    handleSuccess,
  };
};
