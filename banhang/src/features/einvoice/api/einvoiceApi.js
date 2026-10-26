import { apiRequest } from '../../../db/repository.js';

export const getEinvoiceDocuments = ({ from, to, status, search }) => {
  const params = new URLSearchParams({ from, to, status });
  if (search) params.set('search', search);
  return apiRequest(`/einvoice/documents?${params.toString()}`);
};

export const markEinvoicesExported = (invoiceIds, profile) =>
  apiRequest('/einvoice/mark-exported', {
    method: 'POST',
    body: { invoiceIds, profile },
  });

export const unmarkEinvoices = (invoiceIds) =>
  apiRequest('/einvoice/unmark', { method: 'POST', body: { invoiceIds } });

export const setEinvoiceNumber = (invoiceId, number) =>
  apiRequest(`/einvoice/${invoiceId}/number`, {
    method: 'PUT',
    body: { number },
  });
