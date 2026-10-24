import dayjs from 'dayjs';
import { v4 as uuid } from 'uuid';
import { computePaymentStatus } from '../../features/sales/domain/salesDomain.js';
import { paidAmount } from './transactionFactories.js';

const createCodeFactory = () => {
  let sequence = 0;
  return (prefix, date) => {
    sequence += 1;
    const day = dayjs(date).format('YYYYMMDD');
    return `${prefix}-${day}-${String(sequence).padStart(3, '0')}`;
  };
};

const sumLines = (items) => items.reduce((sum, item) => sum + item.lineTotal, 0);

const replayPurchase = async (event, { api, nextCode }) => {
  const items = event.items.map((item) => ({
    ...item,
    lineTotal: item.qty * item.unitCost,
  }));
  const { purchase } = await api.post('/purchases-tools', {
    code: nextCode('PO', event.date),
    supplierId: event.supplierId,
    date: event.date,
    items,
    note: '',
  });
  const amount = paidAmount(purchase.total, event.paidRatio);
  if (amount <= 0) return;
  await api.post('/payments', {
    id: uuid(),
    purchaseId: purchase.id,
    supplierId: event.supplierId,
    paymentType: 'purchase_payment',
    date: event.date,
    method: event.method,
    amount,
    note: '',
  });
};

const buildInvoiceItems = (eventItems, productById) =>
  eventItems.map(({ productId, qty, priceType }) => {
    const product = productById.get(productId);
    const unitPrice =
      priceType === 'wholesale'
        ? product.sellPriceWholesale
        : product.sellPriceDefault;
    return {
      productId,
      qty,
      unitPrice,
      lineTotal: qty * unitPrice,
      lineNote: '',
      costPriceSnapshot: Number(product.avgCost || 0),
      excludeFromProfitSnapshot: Boolean(product.excludeFromProfit),
    };
  });

// Mirrors the sales screen: invoice first (cost snapshot from current avgCost), then its payment.
const replayInvoice = async (event, { api, nextCode }) => {
  const products = await api.get('/products');
  const productById = new Map(products.map((product) => [product.id, product]));
  const items = buildInvoiceItems(event.items, productById);
  const total = sumLines(items);
  const paid = paidAmount(total, event.paidRatio);
  const invoice = await api.post('/invoices', {
    id: uuid(),
    code: nextCode('INV', event.date),
    customerId: event.customerId,
    date: event.date,
    items,
    subTotal: total,
    discountTotal: 0,
    total,
    note: '',
    paymentStatus: computePaymentStatus(total, paid),
    changeLog: [{ date: event.date, note: 'Tạo hóa đơn' }],
  });
  if (paid <= 0) return;
  await api.post('/payments', {
    id: uuid(),
    invoiceId: invoice.id,
    customerId: event.customerId,
    paymentType: 'invoice_payment',
    date: event.date,
    method: event.method,
    amount: paid,
    note: '',
  });
};

const replayDebtReceipt = async (event, { api, nextCode }) => {
  const customer = await api.get(`/customers/${event.customerId}`);
  const amount = paidAmount(Number(customer?.currentDebt || 0), event.ratio);
  if (amount <= 0) return;
  await api.post('/payments', {
    id: uuid(),
    code: nextCode('PTN', event.date),
    customerId: event.customerId,
    paymentType: 'debt_receipt',
    date: event.date,
    method: event.method,
    amount,
    note: 'Thu nợ',
  });
};

const replayExpense = (event, { api }) =>
  api.post('/cashbook', {
    id: uuid(),
    date: event.date,
    type: 'out',
    amount: event.amount,
    category: event.category,
    note: event.note,
  });

const REPLAYERS = {
  purchase: replayPurchase,
  invoice: replayInvoice,
  debtReceipt: replayDebtReceipt,
  expense: replayExpense,
};

// Sends events through the real endpoints in order, so backend code computes stock/debt/cost.
export const replayTransactions = async (events, api) => {
  const context = { api, nextCode: createCodeFactory() };
  for (const event of events) {
    await REPLAYERS[event.kind](event, context);
  }
};
