import { apiRequest } from '../../../db/repository.js';
import { buildReportQueryString } from '../domain/reportFilters.js';

const withQuery = (path, query) => (query ? `${path}?${query}` : path);

export const getSalesInvoicesReport = ({ range, customerId, page, pageSize }) =>
  apiRequest(
    withQuery(
      '/reports/sales-invoices',
      buildReportQueryString({
        range,
        entityKey: 'customerId',
        entityId: customerId,
        page,
        pageSize,
      })
    )
  );

export const getCustomerDebtTimelineReport = ({
  customerId,
  range,
  mode,
} = {}) =>
  apiRequest(
    withQuery(
      '/reports/customer-debt-timeline',
      buildReportQueryString({
        range,
        extras: {
          customerId,
          mode,
        },
      })
    )
  );

export const getSalesInvoiceDetail = (invoiceId) =>
  apiRequest(`/reports/invoices/${invoiceId}`);

export const deleteSalesInvoice = (invoiceId) =>
  apiRequest(`/reports/invoices/${invoiceId}`, { method: 'DELETE' });

export const updateSalesInvoice = (invoiceId, payload) =>
  apiRequest(`/invoices/${invoiceId}`, {
    method: 'PUT',
    body: payload,
  });

export const getSalesDetailsReport = ({ range, customerId, page, pageSize }) =>
  apiRequest(
    withQuery(
      '/reports/sales-details',
      buildReportQueryString({
        range,
        entityKey: 'customerId',
        entityId: customerId,
        page,
        pageSize,
      })
    )
  );

export const getSuppliers = () => apiRequest('/suppliers');

export const getPurchaseInvoicesReport = ({
  range,
  supplierId,
  page,
  pageSize,
}) =>
  apiRequest(
    withQuery(
      '/purchases-tools/recent',
      buildReportQueryString({
        range,
        entityKey: 'supplierId',
        entityId: supplierId,
        page,
        pageSize,
      })
    )
  );

export const getPurchaseDetailReport = (purchaseId) =>
  apiRequest(`/purchases-tools/detail/${purchaseId}`);

export const getPurchaseDetailsReport = ({
  range,
  supplierId,
  page,
  pageSize,
}) =>
  apiRequest(
    withQuery(
      '/purchases-tools/recent',
      buildReportQueryString({
        range,
        entityKey: 'supplierId',
        entityId: supplierId,
        page,
        pageSize,
      })
    )
  );

export const deletePurchaseReport = (purchaseId) =>
  apiRequest(`/purchases/${purchaseId}`, { method: 'DELETE' });

export const getStockReport = () => apiRequest('/reports/stock');

export const getStockMovementReport = ({ range } = {}) =>
  apiRequest(
    withQuery(
      '/reports/stock-movement',
      buildReportQueryString({
        range,
      })
    )
  );

export const getProfitReport = ({ range } = {}) =>
  apiRequest(
    withQuery(
      '/reports/profit',
      buildReportQueryString({
        range,
      })
    )
  );

export const getCashReport = ({ range } = {}) =>
  apiRequest(
    withQuery(
      '/reports/cash',
      buildReportQueryString({
        range,
      })
    )
  );

export const getCustomerDebtReport = () => apiRequest('/reports/debt');

export const getCustomerDebtDetail = (customerId) =>
  apiRequest(`/reports/debt/${customerId}`);

export const getSupplierDebtReport = () => apiRequest('/reports/supplier-debt');

export const getSupplierDebtDetail = (supplierId) =>
  apiRequest(`/reports/supplier-debt/${supplierId}`);

export const updatePaymentRecord = (paymentId, payload) =>
  apiRequest(`/payments/${paymentId}`, {
    method: 'PUT',
    body: payload,
  });

export const deletePaymentRecord = (paymentId) =>
  apiRequest(`/payments/${paymentId}`, { method: 'DELETE' });

export const updateProductOpeningStock = (productId, openingStock) =>
  apiRequest(`/products/${productId}`, {
    method: 'PUT',
    body: {
      openingStock,
    },
  });
