const isEmptyValue = (value) =>
  value === null || value === undefined || value === '';

export const formatReportMeasure = (
  value,
  { blankOnEmpty = false } = {}
) => {
  if (blankOnEmpty && isEmptyValue(value)) return '';
  const number = Number(value || 0);
  if (!Number.isFinite(number)) return '';
  return new Intl.NumberFormat('vi-VN', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 3,
  }).format(number);
};

export const formatReportDimension = (value) => {
  const number = Number(value || 0);
  return number > 0 ? formatReportMeasure(number) : '';
};

export const getReportTotalMeasure = (item) => {
  const qty = Number(item?.qty || 0);
  const length = Number(item?.length || 0);
  const width = Number(item?.width || 0);
  return length > 0 && width > 0 ? qty * length * width : qty;
};
