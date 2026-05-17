export const formatMoney = (value) => {
  const number = Number(value || 0);
  return new Intl.NumberFormat('vi-VN').format(number);
};

export const formatRoundedMoney = (value) => {
  const number = Number(value || 0);
  return new Intl.NumberFormat('vi-VN', {
    maximumFractionDigits: 0,
  }).format(number);
};
