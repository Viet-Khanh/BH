import { message } from 'antd';

export const buildInvoicePayload = ({
  items,
  products,
  invoice,
  draftCode,
  customerId,
  defaultCustomerId,
  date,
  totals,
  status,
  note,
}) => {
  if (!items.length) {
    message.error('Vui lòng thêm hàng hóa.');
    return null;
  }
  const invalid = items.find(
    (item) => Number(item.qty || 0) === 0 || Number(item.unitPrice || 0) < 0
  );
  if (invalid) {
    message.error('Số lượng khác 0 và đơn giá >= 0.');
    return null;
  }

  const nextItems = items.map((item) => {
    if (item.costPriceSnapshot) return item;
    const product = products.find((p) => p.id === item.productId);
    return { ...item, costPriceSnapshot: Number(product?.avgCost || 0) };
  });

  return {
    code: invoice?.code || draftCode,
    customerId: customerId || defaultCustomerId,
    date,
    items: nextItems,
    subTotal: totals.subTotal,
    discountTotal: 0,
    total: totals.total,
    paymentStatus: status,
    note,
  };
};

export const createPersistInvoice = ({ onSave, invoice, ...payloadDeps }) => async () => {
  const payload = buildInvoicePayload(payloadDeps);
  if (!payload) return null;
  const saved = await onSave(payload);
  return saved || invoice || null;
};
