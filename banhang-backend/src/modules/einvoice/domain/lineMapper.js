const positive = (value) => {
  const number = Number(value || 0);
  return number > 0 ? number : null;
};

const round3 = (value) => Math.round(value * 1000) / 1000;

const decimal = (value) => String(round3(value)).replace('.', ',');

// One invoice item → one e-invoice line. Length × width items are sent in
// square metres so that quantity × unit price = amount, as e-invoices require.
export const mapLine = (item = {}, product = null, index = 1) => {
  const qty = Number(item.qty || 0);
  const name = product?.name || item.name || 'Sản phẩm';
  const unit = item.unitName || product?.unit || '';
  const unitPrice = Number(item.unitPrice || 0);
  const base = {
    index,
    code: product?.code || '',
    name,
    unit,
    quantity: qty,
    unitPrice,
    amount: Number(item.lineTotal ?? qty * unitPrice),
    note: item.lineNote || '',
  };
  const length = positive(item.length);
  const width = positive(item.width);
  if (!length || !width) return base;
  return {
    ...base,
    name: `${name} (${decimal(qty)} ${unit}, ${decimal(length)}×${decimal(width)})`,
    unit: 'm2',
    quantity: round3(qty * length * width),
  };
};
