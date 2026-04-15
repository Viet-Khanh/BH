import { useCallback, useState } from 'react';
import {
  createPayment,
  removePayment,
  updatePayment,
} from '../api/purchasesApi.js';

export const usePurchasePaymentRecords = ({ editing, supplierId }) => {
  const [purchasePayments, setPurchasePayments] = useState([]);

  const addPayment = useCallback(
    async (payment) => {
      const payload = {
        ...payment,
        paymentType: payment.paymentType || 'purchase_payment',
        supplierId:
          payment.supplierId || editing?.supplierId || supplierId || '',
      };
      const created = await createPayment(payload);
      const nextPayment = created || payload;
      setPurchasePayments((prev) => [...prev, nextPayment]);
    },
    [editing?.supplierId, supplierId]
  );

  const updatePaymentEntry = useCallback(
    async (paymentId, data) => {
      const existing = purchasePayments.find(
        (payment) => payment.id === paymentId
      );
      const payload = {
        ...existing,
        ...data,
        paymentType:
          data.paymentType || existing?.paymentType || 'purchase_payment',
        supplierId:
          data.supplierId ||
          existing?.supplierId ||
          editing?.supplierId ||
          supplierId ||
          '',
      };
      const saved = await updatePayment(paymentId, payload);
      const nextPayment = saved || payload;
      setPurchasePayments((prev) =>
        prev.map((payment) =>
          payment.id === paymentId ? nextPayment : payment
        )
      );
    },
    [editing?.supplierId, purchasePayments, supplierId]
  );

  const removePaymentEntry = useCallback(async (paymentId) => {
    await removePayment(paymentId);
    setPurchasePayments((prev) =>
      prev.filter((payment) => payment.id !== paymentId)
    );
  }, []);

  return {
    purchasePayments,
    setPurchasePayments,
    addPayment,
    updatePayment: updatePaymentEntry,
    removePayment: removePaymentEntry,
  };
};
