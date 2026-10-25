const numberFormat = new Intl.NumberFormat('vi-VN', {
  minimumFractionDigits: 0,
  maximumFractionDigits: 3,
});

export const isEmptyValue = (value) =>
  value === null || value === undefined || value === '';

export const formatMeasure = (
  value,
  { blankOnEmpty = false, blankOnZero = false } = {}
) => {
  if (blankOnEmpty && isEmptyValue(value)) return '';
  const number = Number(value || 0);
  if (!Number.isFinite(number)) return '';
  if (blankOnZero && number === 0) return '';
  return numberFormat.format(number);
};

export const formatDimension = (value) => {
  const number = Number(value || 0);
  return number > 0 ? formatMeasure(number) : '';
};
