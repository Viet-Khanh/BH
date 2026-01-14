export const getPaymentStatus = (total, paid) => {
  if (paid <= 0) return 'CHUA THU';
  if (paid < total) return 'THU 1 PHAN';
  return 'DA THU';
};

export const isGlassProduct = (product) => {
  const group = (product?.group || '').toLowerCase();
  const name = (product?.name || '').toLowerCase();
  const unit = (product?.unit || '').toLowerCase();
  return (
    group.includes('kính') ||
    group.includes('kinh') ||
    name.includes('kính') ||
    name.includes('kinh') ||
    unit === 'm2'
  );
};

export const getLineBase = (item, product) => {
  const qty = Number(item.qty || 0);
  const unitPrice = Number(item.unitPrice || 0);
  let base = qty * unitPrice;
  const length = Number(item.length || 0);
  const width = Number(item.width || 0);
  if (length > 0 && width > 0) {
    base *= length * width;
  }
  return base;
};
