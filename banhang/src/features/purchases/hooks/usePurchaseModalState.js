import { useState } from 'react';

export const usePurchaseModalState = () => {
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [paymentNote, setPaymentNote] = useState('');
  const [supplierDebtPaymentOpen, setSupplierDebtPaymentOpen] = useState(false);
  const [supplierDebtPaymentSupplierId, setSupplierDebtPaymentSupplierId] =
    useState('');
  const [previewOpen, setPreviewOpen] = useState(false);

  return {
    paymentModalOpen,
    setPaymentModalOpen,
    paymentAmount,
    setPaymentAmount,
    paymentMethod,
    setPaymentMethod,
    paymentNote,
    setPaymentNote,
    supplierDebtPaymentOpen,
    setSupplierDebtPaymentOpen,
    supplierDebtPaymentSupplierId,
    setSupplierDebtPaymentSupplierId,
    previewOpen,
    setPreviewOpen,
  };
};
