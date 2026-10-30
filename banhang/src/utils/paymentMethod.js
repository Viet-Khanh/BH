export const PAYMENT_METHOD_LABELS = {
  cash: 'Tiền mặt',
  bank: 'Chuyển khoản',
  debt: 'Công nợ',
  other: 'Khác',
  migration: 'Số dư đầu kỳ',
};

export const formatPaymentMethod = (value) =>
  PAYMENT_METHOD_LABELS[value] || value || '';

export const getLatestPaymentMethod = (payments = []) => {
  const latest = [...payments]
    .filter((payment) => payment?.method)
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .at(-1);
  return latest?.method || 'cash';
};
