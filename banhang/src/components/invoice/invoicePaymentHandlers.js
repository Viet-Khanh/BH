import { message } from 'antd';
import { v4 as uuid } from 'uuid';

export const createCheckoutHandler =
  ({
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
  }) =>
  async (shouldPrint) => {
    const enteredPaid = Number(paymentAmount || 0);
    const existingPaid = isEdit ? paidTotal : 0;
    const savedInvoice = await persistInvoice();
    if (!savedInvoice) return;
    let nextPaymentsForPrint = Array.isArray(payments) ? [...payments] : [];

    const addPayment = async (amount) => {
      const payload = {
        id: uuid(),
        invoiceId: savedInvoice.id,
        date: new Date().toISOString(),
        method: paymentMethod,
        amount,
        note: paymentNote,
      };
      await onAddPayment(payload);
      nextPaymentsForPrint = [...nextPaymentsForPrint, payload];
    };

    if (isEdit) {
      if (enteredPaid > existingPaid) {
        const addAmount = enteredPaid - existingPaid;
        await addPayment(addAmount);
      } else if (enteredPaid < existingPaid) {
        if (!payments.length || !onUpdatePayment) {
          await addPayment(enteredPaid - existingPaid);
        } else {
          const sortedPayments = [...payments].sort(
            (a, b) => new Date(a.date) - new Date(b.date)
          );
          const lastPayment = sortedPayments[sortedPayments.length - 1];
          const sumExceptLast = existingPaid - Number(lastPayment.amount || 0);
          const newLastAmount = enteredPaid - sumExceptLast;
          if (newLastAmount === 0) {
            if (onRemovePayment) {
              await onRemovePayment(lastPayment.id);
              nextPaymentsForPrint = nextPaymentsForPrint.filter(
                (payment) => payment.id !== lastPayment.id
              );
            } else {
              message.error('Không thể giảm số tiền đã thu.');
              return;
            }
          } else {
            const updatedPayment = {
              ...lastPayment,
              amount: newLastAmount,
              method: paymentMethod,
              note: paymentNote,
            };
            await onUpdatePayment(lastPayment.id, {
              amount: newLastAmount,
              method: paymentMethod,
              note: paymentNote,
            });
            nextPaymentsForPrint = nextPaymentsForPrint.map((payment) =>
              payment.id === lastPayment.id ? updatedPayment : payment
            );
          }
        }
      }
    } else if (enteredPaid !== 0) {
      await addPayment(enteredPaid);
    }
    setPaymentAmount(0);
    setPaymentNote('');
    setPaymentMethod('cash');
    setPaymentModalOpen(false);
    if (shouldPrint) {
      await handlePrint(nextPaymentsForPrint);
    }
    handleNewTicket();
  };
