const roundedNumberFormatter = new Intl.NumberFormat('vi-VN', {
  maximumFractionDigits: 0,
});

export const formatRoundedReportNumber = (value) =>
  roundedNumberFormatter.format(Number(value || 0));
