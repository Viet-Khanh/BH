import {
  addItem,
  apiRequest,
  deleteItem,
  updateItem,
} from '../../../db/repository.js';

export const getInvoiceEditContext = async (invoiceId) =>
  apiRequest(`/reports/invoices/${invoiceId}`);

export const searchSalesProducts = async (keyword = '', options = {}) => {
  const params = new URLSearchParams();
  if (keyword) params.set('search', keyword);
  params.set('limit', String(options.limit || 30));
  if (options.includeDeleted) params.set('includeDeleted', '1');

  return apiRequest(`/sales/products?${params.toString()}`);
};

export const getCustomerDebt = async ({
  customerId,
  excludeInvoiceId,
  asOfDate,
}) => {
  const params = new URLSearchParams({ customerId });
  if (excludeInvoiceId) params.set('excludeInvoiceId', excludeInvoiceId);
  if (asOfDate) params.set('asOfDate', asOfDate);
  return apiRequest(`/sales/customer-debt?${params.toString()}`);
};

export const createProduct = async (payload) => addItem('products', payload);

export const createInvoice = async (payload) => addItem('invoices', payload);

export const updateInvoice = async (invoiceId, payload) =>
  updateItem('invoices', invoiceId, payload);

export const updateInvoicePaymentStatus = async (invoiceId, paymentStatus) =>
  updateItem('invoices', invoiceId, { paymentStatus });

export const createPayment = async (payload) => addItem('payments', payload);

export const updatePayment = async (paymentId, payload) =>
  updateItem('payments', paymentId, payload);

export const removePayment = async (paymentId) =>
  deleteItem('payments', paymentId);
