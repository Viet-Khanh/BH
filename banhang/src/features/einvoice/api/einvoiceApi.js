import { apiRequest } from '../../../db/repository.js';

export const getEinvoiceDocuments = ({
  from,
  to,
  status,
  search,
  requestedOnly,
}) => {
  const params = new URLSearchParams({ from, to, status });
  if (search) params.set('search', search);
  if (requestedOnly) params.set('requestedOnly', 'true');
  return apiRequest(`/einvoice/documents?${params.toString()}`);
};

export const markEinvoicesExported = (invoiceIds, profile) =>
  apiRequest('/einvoice/mark-exported', {
    method: 'POST',
    body: { invoiceIds, profile },
  });

export const unmarkEinvoices = (invoiceIds) =>
  apiRequest('/einvoice/unmark', { method: 'POST', body: { invoiceIds } });

// values: { number, series?, lookupCode?, taxAuthorityCode? }
export const setEinvoiceNumber = (invoiceId, values) =>
  apiRequest(`/einvoice/${invoiceId}/number`, {
    method: 'PUT',
    body: values,
  });

export const getEinvoiceSummary = ({ since, todayStart }) =>
  apiRequest(
    `/einvoice/summary?${new URLSearchParams({ since, todayStart }).toString()}`
  );
