import { useCallback } from 'react';
import { message } from 'antd';
import {
  createPayment,
  removePayment,
  updateInvoicePaymentStatus,
  updatePayment,
} from '../api/salesApi.js';
import { computePaymentStatus, sumPayments } from '../domain/salesDomain.js';

export const useSalesPayments = ({
  editingRef,
  invoicePaymentsRef,
  setEditing,
  setInvoicePayments,
}) => {
  const refreshPaymentStatus = useCallback(
    async (invoiceId, nextPayments) => {
      const targetInvoice = editingRef.current;
      const total =
        targetInvoice?.id === invoiceId ? Number(targetInvoice.total || 0) : 0;
      const paymentStatus = computePaymentStatus(
        total,
        sumPayments(nextPayments)
      );
      await updateInvoicePaymentStatus(invoiceId, paymentStatus);
      setEditing((prev) =>
        prev?.id === invoiceId ? { ...prev, paymentStatus } : prev
      );
    },
    [editingRef, setEditing]
  );

  const addPayment = useCallback(
    async (payment) => {
      const invoiceId = payment.invoiceId || editingRef.current?.id;
      if (!invoiceId) return;

      const payload = {
        ...payment,
        invoiceId,
        paymentType: payment.paymentType || 'invoice_payment',
        customerId: payment.customerId || editingRef.current?.customerId || '',
      };
      const created = await createPayment(payload);
      const nextPayment = created || payload;
      const nextPayments = [...invoicePaymentsRef.current, nextPayment];

      invoicePaymentsRef.current = nextPayments;
      setInvoicePayments(nextPayments);
      await refreshPaymentStatus(invoiceId, nextPayments);
      message.success('Đã ghi nhận thanh toán.');
    },
    [editingRef, invoicePaymentsRef, refreshPaymentStatus, setInvoicePayments]
  );

  const updatePaymentEntry = useCallback(
    async (paymentId, data) => {
      const existing = invoicePaymentsRef.current.find(
        (payment) => payment.id === paymentId
      );
      const invoiceId =
        data.invoiceId || existing?.invoiceId || editingRef.current?.id;
      if (!existing || !invoiceId) return;

      const nextPayment = {
        ...existing,
        ...data,
        invoiceId,
        paymentType:
          data.paymentType || existing.paymentType || 'invoice_payment',
        customerId:
          data.customerId ||
          existing.customerId ||
          editingRef.current?.customerId ||
          '',
      };
      const saved = await updatePayment(paymentId, nextPayment);
      const updated = saved || nextPayment;
      const nextPayments = invoicePaymentsRef.current.map((payment) =>
        payment.id === paymentId ? updated : payment
      );

      invoicePaymentsRef.current = nextPayments;
      setInvoicePayments(nextPayments);
      await refreshPaymentStatus(invoiceId, nextPayments);
      message.success('Đã cập nhật thanh toán.');
    },
    [editingRef, invoicePaymentsRef, refreshPaymentStatus, setInvoicePayments]
  );

  const removePaymentEntry = useCallback(
    async (paymentId) => {
      const existing = invoicePaymentsRef.current.find(
        (payment) => payment.id === paymentId
      );
      const invoiceId = existing?.invoiceId || editingRef.current?.id;
      if (!invoiceId) return;

      await removePayment(paymentId);
      const nextPayments = invoicePaymentsRef.current.filter(
        (payment) => payment.id !== paymentId
      );

      invoicePaymentsRef.current = nextPayments;
      setInvoicePayments(nextPayments);
      await refreshPaymentStatus(invoiceId, nextPayments);
      message.success('Đã cập nhật thanh toán.');
    },
    [editingRef, invoicePaymentsRef, refreshPaymentStatus, setInvoicePayments]
  );

  return {
    addPayment,
    updatePayment: updatePaymentEntry,
    removePayment: removePaymentEntry,
  };
};
