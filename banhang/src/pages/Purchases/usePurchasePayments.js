import { useEffect, useMemo } from 'react';
import { message } from 'antd';
import { v4 as uuid } from 'uuid';

const buildPaymentsByPurchase = (payments = []) =>
  payments.reduce((acc, payment) => {
    if (!payment.purchaseId) return acc;
    if (payment.paymentType === 'supplier_debt_payment') return acc;
    acc[payment.purchaseId] = (acc[payment.purchaseId] || 0) + Number(payment.amount || 0);
    return acc;
  }, {});

const getPaymentsByPurchaseId = (payments, purchaseId) =>
  payments.filter((payment) => payment.purchaseId === purchaseId);

const usePurchasePayments = ({
  editing,
  payments = [],
  purchases = [],
  supplierId,
  totals,
  supplierDebtOverride,
  paymentAmount,
  setPaymentAmount,
  paymentMethod,
  setPaymentMethod,
  paymentNote,
  setPaymentNote,
  paymentModalOpen,
  setPaymentModalOpen,
  persistPurchase,
  persistOnEdit = false,
  resetForm,
  addPayment,
  updatePayment,
  removePayment,
}) => {
  const isEdit = Boolean(editing);
  const paymentsByPurchase = useMemo(() => buildPaymentsByPurchase(payments), [payments]);
  const paidTotal = useMemo(() => {
    if (!editing?.id) return 0;
    return getPaymentsByPurchaseId(payments, editing.id).reduce(
      (sum, payment) => sum + Number(payment.amount || 0),
      0
    );
  }, [payments, editing]);
  const computedSupplierDebt = useMemo(() => {
    if (!supplierId) return 0;
    return purchases
      .filter((purchase) => purchase.supplierId === supplierId && purchase.id !== editing?.id)
      .reduce((sum, purchase) => {
        const paid = paymentsByPurchase[purchase.id] || 0;
        return sum + Number(purchase.total || 0) - paid;
      }, 0);
  }, [supplierId, purchases, paymentsByPurchase, editing]);
  const supplierDebt =
    supplierDebtOverride !== undefined && supplierDebtOverride !== null
      ? Number(supplierDebtOverride || 0)
      : computedSupplierDebt;
  const totalPayment = totals + supplierDebt;
  const remainingPayment = totalPayment - Number(paymentAmount || 0);

  useEffect(() => {
    if (!paymentModalOpen) return;
    setPaymentAmount(isEdit ? paidTotal : 0);
    setPaymentNote('');
    setPaymentMethod('cash');
  }, [paymentModalOpen, isEdit, paidTotal, setPaymentAmount, setPaymentNote, setPaymentMethod]);

  const purchasePayments = useMemo(() => {
    if (!editing?.id) return [];
    return getPaymentsByPurchaseId(payments, editing.id);
  }, [payments, editing]);

  const handleCheckout = async () => {
    const target = editing && !persistOnEdit ? editing : await persistPurchase();
    if (!target) return;
    const existingPayments = getPaymentsByPurchaseId(payments, target.id);
    const existingPaid = existingPayments.reduce(
      (sum, payment) => sum + Number(payment.amount || 0),
      0
    );
    const enteredPaid = Number(paymentAmount || 0);
    const addPaymentEntry = async (amount) => {
      await addPayment({
        id: uuid(),
        purchaseId: target.id,
        date: new Date().toISOString(),
        method: paymentMethod,
        amount,
        note: paymentNote,
      });
    };
    if (enteredPaid > existingPaid) {
      await addPaymentEntry(enteredPaid - existingPaid);
    } else if (enteredPaid < existingPaid) {
      if (!existingPayments.length || !updatePayment) {
        await addPaymentEntry(enteredPaid - existingPaid);
      } else {
        const sortedPayments = [...existingPayments].sort((a, b) => new Date(a.date) - new Date(b.date));
        const lastPayment = sortedPayments[sortedPayments.length - 1];
        const sumExceptLast = existingPaid - Number(lastPayment.amount || 0);
        const newLastAmount = enteredPaid - sumExceptLast;
        if (newLastAmount === 0) {
          if (removePayment) {
            await removePayment(lastPayment.id);
          } else {
            message.error('Không thể giảm số tiền đã trả.');
            return;
          }
        } else {
          await updatePayment(lastPayment.id, {
            amount: newLastAmount,
            method: paymentMethod,
            note: paymentNote,
          });
        }
      }
    }
    message.success('Đã ghi nhận thanh toán.');
    setPaymentAmount(0);
    setPaymentNote('');
    setPaymentMethod('cash');
    setPaymentModalOpen(false);
    if (!editing) resetForm();
  };

  return {
    paidTotal,
    supplierDebt,
    totalPayment,
    remainingPayment,
    purchasePayments,
    handleCheckout,
  };
};

export default usePurchasePayments;
