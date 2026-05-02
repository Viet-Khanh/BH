export const API_BASE =
  import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const parseBody = (text) => {
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch (error) {
    return text;
  }
};

const stripMeta = (payload) => {
  if (!payload || typeof payload !== 'object') return payload;
  const { _id, __v, ...rest } = payload;
  return rest;
};

export const apiRequest = async (path, options = {}) => {
  const url = `${API_BASE}${path}`;
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  const config = { ...options, headers };
  if (config.body !== undefined && typeof config.body !== 'string') {
    config.body = JSON.stringify(config.body);
  }

  const response = await fetch(url, config);
  const text = await response.text();
  const data = parseBody(text);

  if (!response.ok) {
    if (response.status === 404) return null;
    const message = (data && data.message) || text || 'Request failed';
    throw new Error(message);
  }

  return data;
};

export const getAll = async (table, options = {}) => {
  const query = options.includeDeleted ? '?includeDeleted=1' : '';
  return apiRequest(`/${table}${query}`);
};

export const getById = async (table, id) => apiRequest(`/${table}/${id}`);

export const addItem = async (table, item) =>
  apiRequest(`/${table}`, { method: 'POST', body: stripMeta(item) });

export const updateItem = async (table, id, data) =>
  apiRequest(`/${table}/${id}`, { method: 'PUT', body: stripMeta(data) });

export const deleteItem = async (table, id) =>
  apiRequest(`/${table}/${id}`, { method: 'DELETE' });

export const bulkAdd = async (table, items) =>
  apiRequest(`/${table}/bulk`, {
    method: 'POST',
    body: Array.isArray(items) ? items.map(stripMeta) : [],
  });

export const bulkUpdateProductPricesByName = async (items) =>
  apiRequest('/products-tools/price-update-by-name', {
    method: 'POST',
    body: Array.isArray(items) ? items.map(stripMeta) : [],
  });

export const bulkFillMissingAvgCostFromRetail = async (ids) =>
  apiRequest('/products-tools/fill-missing-avg-cost-from-retail', {
    method: 'POST',
    body: { ids: Array.isArray(ids) ? ids : [] },
  });

export const clearAll = async () => apiRequest('/reset', { method: 'POST' });

export const getSettings = async () => getById('settings', 'main');

export const saveSettings = async (settings) =>
  updateItem('settings', 'main', { ...settings, id: 'main' });
