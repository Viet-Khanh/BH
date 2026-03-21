import dayjs from 'dayjs';

const EVENT_ORDER = {
  invoice: 0,
  invoice_payment: 1,
  debt_receipt: 2,
};

const compareDebtEvents = (left, right) => {
  const dateDiff = new Date(left.date) - new Date(right.date);
  if (dateDiff !== 0) return dateDiff;

  const orderDiff = (EVENT_ORDER[left.type] ?? 99) - (EVENT_ORDER[right.type] ?? 99);
  if (orderDiff !== 0) return orderDiff;

  return String(left.sortKey || left.id || '').localeCompare(String(right.sortKey || right.id || ''));
};

export const buildPaymentsByInvoice = (payments = []) => {
  const map = {};
  payments.forEach((payment) => {
    if (!payment.invoiceId) return;
    if (payment.paymentType === 'debt_receipt') return;
    map[payment.invoiceId] = (map[payment.invoiceId] || 0) + Number(payment.amount || 0);
  });
  return map;
};

const buildDebtEvents = ({ invoices = [], payments = [], excludeInvoiceId = '' } = {}) => {
  const invoiceMap = invoices.reduce((acc, invoice) => {
    acc[invoice.id] = invoice;
    return acc;
  }, {});

  const invoiceEvents = invoices
    .filter((invoice) => invoice?.id && invoice.id !== excludeInvoiceId && invoice.customerId && invoice.date)
    .map((invoice) => ({
      id: `invoice:${invoice.id}`,
      type: 'invoice',
      date: invoice.date,
      invoiceId: invoice.id,
      customerId: invoice.customerId,
      amount: Number(invoice.total || 0),
      sortKey: String(invoice._id || invoice.id || ''),
    }));

  const invoicePaymentEvents = payments
    .filter((payment) => {
      if (!payment?.invoiceId) return false;
      if (payment.invoiceId === excludeInvoiceId) return false;
      if (payment.paymentType === 'debt_receipt') return false;
      if (!payment.date) return false;
      return Boolean(invoiceMap[payment.invoiceId]?.customerId);
    })
    .map((payment) => ({
      id: `invoice-payment:${payment.id}`,
      type: 'invoice_payment',
      date: payment.date,
      invoiceId: payment.invoiceId,
      customerId: payment.customerId || invoiceMap[payment.invoiceId]?.customerId || '',
      amount: Number(payment.amount || 0),
      sortKey: String(payment._id || payment.id || ''),
    }));

  const debtReceiptEvents = payments
    .filter(
      (payment) =>
        payment?.paymentType === 'debt_receipt' &&
        payment.customerId &&
        payment.date
    )
    .map((payment) => ({
      id: `debt-receipt:${payment.id}`,
      type: 'debt_receipt',
      date: payment.date,
      customerId: payment.customerId,
      amount: Number(payment.amount || 0),
      sortKey: String(payment._id || payment.id || ''),
    }));

  return [...invoiceEvents, ...invoicePaymentEvents, ...debtReceiptEvents]
    .filter((event) => dayjs(event.date).isValid())
    .sort(compareDebtEvents);
};

export const buildOldDebtByInvoiceTimeline = ({ invoices = [], payments = [] } = {}) => {
  const events = buildDebtEvents({ invoices, payments });
  const balances = {};
  const oldDebtByInvoice = {};

  events.forEach((event) => {
    const customerId = event.customerId;
    const currentDebt = Number(balances[customerId] || 0);

    if (event.type === 'invoice') {
      oldDebtByInvoice[event.invoiceId] = currentDebt;
      balances[customerId] = currentDebt + Number(event.amount || 0);
      return;
    }

    balances[customerId] = currentDebt - Number(event.amount || 0);
  });

  return oldDebtByInvoice;
};

export const computeCustomerDebtBeforeDate = ({
  invoices = [],
  payments = [],
  customerId = '',
  asOfDate,
  excludeInvoiceId = '',
} = {}) => {
  if (!customerId || !asOfDate || !dayjs(asOfDate).isValid()) return 0;

  const targetDate = dayjs(asOfDate);
  const targetInvoice = excludeInvoiceId
    ? invoices.find((invoice) => invoice.id === excludeInvoiceId) || null
    : null;
  const targetEvent = targetInvoice
    ? {
        id: `invoice:${targetInvoice.id}`,
        type: 'invoice',
        date: targetInvoice.date,
        sortKey: String(targetInvoice._id || targetInvoice.id || ''),
      }
    : null;
  const events = buildDebtEvents({ invoices, payments, excludeInvoiceId });
  let balance = 0;

  events.forEach((event) => {
    if (event.customerId !== customerId) return;

    if (targetEvent) {
      if (compareDebtEvents(event, targetEvent) >= 0) return;
    } else if (dayjs(event.date).isAfter(targetDate)) {
      return;
    }

    if (event.type === 'invoice') {
      balance += Number(event.amount || 0);
      return;
    }

    balance -= Number(event.amount || 0);
  });

  return balance;
};
