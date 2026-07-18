import { formatMoney } from '../../../utils/moneyFormat.js';
import { generateCode } from '../../../utils/codeGenerator.js';

export const computePaymentStatus = (total, paid) => {
  if (paid <= 0) return 'CHUA THU';
  if (paid < total) return 'THU 1 PHAN';
  return 'DA THU';
};

export const sumPayments = (items = []) =>
  items.reduce((sum, payment) => sum + Number(payment.amount || 0), 0);

export const mergeProducts = (current = [], incoming = []) => {
  const productMap = new Map();

  incoming.forEach((item) => {
    if (item?.id) productMap.set(item.id, item);
  });
  current.forEach((item) => {
    if (item?.id && !productMap.has(item.id)) productMap.set(item.id, item);
  });

  return Array.from(productMap.values());
};

export const buildProductPayload = ({ values, id, buildCodeFromName }) => ({
  ...values,
  id,
  code: values.code || buildCodeFromName(values.name || ''),
  avgCost: Number(values.avgCost || 0),
  sellPriceDefault: Number(values.sellPriceDefault || 0),
  sellPriceWholesale: Number(values.sellPriceWholesale || 0),
  openingStock: Number(values.openingStock || 0),
  excludeFromProfit: Boolean(values.excludeFromProfit),
  createdAt: new Date().toISOString(),
});

export const buildCreatedInvoicePayload = ({ data, id }) => ({
  id,
  code: data.code || generateCode('INV'),
  paymentStatus: 'CHUA THU',
  changeLog: [{ date: new Date().toISOString(), note: 'Tạo hóa đơn' }],
  ...data,
});

export const buildCopiedInvoiceDraft = (
  invoice,
  now = new Date().toISOString()
) => {
  if (!invoice) return null;

  const draft = { ...invoice };
  delete draft.id;
  delete draft.code;
  delete draft.changeLog;
  delete draft.customerId;
  delete draft.paymentStatus;

  return {
    ...draft,
    customerId: '',
    date: now,
    items: Array.isArray(invoice.items)
      ? invoice.items.map((item) => {
          const draftItem = { ...item };
          delete draftItem.costPriceSnapshot;
          delete draftItem.excludeFromProfitSnapshot;
          return draftItem;
        })
      : [],
  };
};

export const buildUpdatedInvoicePayload = ({ editing, data, paid }) => {
  const logs = [...(editing.changeLog || [])];

  if (editing.total !== data.total) {
    logs.push({
      date: new Date().toISOString(),
      note: `Cập nhật tổng từ ${formatMoney(editing.total)} -> ${formatMoney(data.total)}`,
    });
  } else {
    logs.push({
      date: new Date().toISOString(),
      note: 'Cập nhật hóa đơn',
    });
  }

  return {
    ...editing,
    ...data,
    paymentStatus: computePaymentStatus(data.total, paid),
    changeLog: logs,
  };
};
