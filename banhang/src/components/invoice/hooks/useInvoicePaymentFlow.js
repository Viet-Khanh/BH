import { useEffect, useMemo, useState } from 'react';
import { createCheckoutHandler } from '../invoicePaymentHandlers.js';

export const useInvoicePaymentFlow = ({
  isEdit,
  paidTotal,
  payments,
  customerDebt,
  total,
  persistInvoice,
  handlePrint,
  handleNewTicket,
  onAddPayment,
  onUpdatePayment,
  onRemovePayment,
}) => {
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [paymentNote, setPaymentNote] = useState('');

  useEffect(() => {
    if (!paymentModalOpen) return;

    setPaymentAmount(isEdit ? paidTotal : 0);
    setPaymentNote('');
    setPaymentMethod('cash');
  }, [isEdit, paidTotal, paymentModalOpen]);

  const handleCheckout = useMemo(
    () =>
      createCheckoutHandler({
        isEdit,
        paidTotal,
        paymentAmount,
        payments,
        onAddPayment,
        onUpdatePayment,
        onRemovePayment,
        paymentMethod,
        paymentNote,
        persistInvoice,
        handlePrint,
        handleNewTicket,
        setPaymentAmount,
        setPaymentNote,
        setPaymentMethod,
        setPaymentModalOpen,
      }),
    [
      handleNewTicket,
      handlePrint,
      isEdit,
      onAddPayment,
      onRemovePayment,
      onUpdatePayment,
      paidTotal,
      paymentAmount,
      paymentMethod,
      paymentNote,
      payments,
      persistInvoice,
    ]
  );

  const totalPayment = total + customerDebt;
  const remainingPayment = totalPayment - Number(paymentAmount || 0);

  return {
    paymentModalOpen,
    setPaymentModalOpen,
    paymentAmount,
    setPaymentAmount,
    paymentMethod,
    setPaymentMethod,
    paymentNote,
    setPaymentNote,
    totalPayment,
    remainingPayment,
    handleCheckout,
  };
};
