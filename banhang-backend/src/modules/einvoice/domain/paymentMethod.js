// Payment method code printed on e-invoices: TM (cash), CK (bank transfer), TM/CK.
export const resolvePaymentMethod = (payments = []) => {
  const methods = new Set(
    payments
      .filter((payment) => Number(payment?.amount || 0) > 0)
      .map((payment) => (payment.method === 'bank' ? 'CK' : 'TM'))
  );
  return methods.size === 1 ? [...methods][0] : 'TM/CK';
};
