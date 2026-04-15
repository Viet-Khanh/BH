import {
  addItem,
  apiRequest,
  deleteItem,
  updateItem,
} from '../../../db/repository.js';

export const searchPurchaseProducts = async (keyword = '', options = {}) => {
  const params = new URLSearchParams();
  if (keyword) params.set('search', keyword);
  params.set('limit', String(options.limit || 30));
  return apiRequest(`/sales/products?${params.toString()}`);
};

export const getSupplierDebt = async ({
  supplierId,
  excludePurchaseId,
} = {}) => {
  const params = new URLSearchParams();
  if (supplierId) params.set('supplierId', supplierId);
  if (excludePurchaseId) params.set('excludePurchaseId', excludePurchaseId);
  return apiRequest(`/purchases-tools/supplier-debt?${params.toString()}`);
};

export const getRecentPurchases = async ({
  limit = 200,
  supplierId,
  from,
  to,
  page,
  pageSize,
} = {}) => {
  const params = new URLSearchParams({ limit: String(limit) });
  if (supplierId) params.set('supplierId', supplierId);
  if (from) params.set('from', from);
  if (to) params.set('to', to);
  if (page) params.set('page', String(page));
  if (pageSize) params.set('pageSize', String(pageSize));
  return apiRequest(`/purchases-tools/recent?${params.toString()}`);
};

export const getPurchaseDetail = async (purchaseId) =>
  apiRequest(`/purchases-tools/detail/${purchaseId}`);

export const createPurchase = async (payload) =>
  apiRequest('/purchases-tools', {
    method: 'POST',
    body: payload,
  });

export const updatePurchase = async (purchaseId, payload) =>
  apiRequest(`/purchases-tools/${purchaseId}`, {
    method: 'PUT',
    body: payload,
  });

export const createPayment = async (payload) => addItem('payments', payload);

export const updatePayment = async (paymentId, payload) =>
  updateItem('payments', paymentId, payload);

export const removePayment = async (paymentId) =>
  deleteItem('payments', paymentId);
