import {
  EinvoiceInputError,
  STATUSES,
  matchesStatus,
} from '../domain/status.js';
import { validateSettings } from '../domain/validation.js';
import { findSalesInvoices } from '../repositories/einvoice.repository.js';
import { buildItems, loadSettings } from './documentItems.js';

// Lists e-invoice documents (+ validation, diff) for a date range.
const matchesSearch = (item, search) => {
  const keyword = String(search || '')
    .trim()
    .toLowerCase();
  if (!keyword) return true;
  const { buyer } = item.document;
  return [item.code, buyer.name, buyer.companyName, buyer.taxCode].some(
    (value) =>
      String(value || '')
        .toLowerCase()
        .includes(keyword)
  );
};

export const requireRange = ({ from, to }) => {
  if (!from || !to)
    throw new EinvoiceInputError('Thiếu khoảng ngày (from, to).');
};

// Opening-balance imports (importBatchId) are not real sales.
export const findRealSales = async (range) =>
  (await findSalesInvoices(range)).filter((invoice) => !invoice.importBatchId);

export const listDocuments = async ({
  from,
  to,
  status = 'pending',
  search,
  requestedOnly,
}) => {
  requireRange({ from, to });
  if (!STATUSES.includes(status))
    throw new EinvoiceInputError(`Trạng thái không hợp lệ: ${status}`);
  const settings = await loadSettings();
  const invoices = (await findRealSales({ from, to })).filter((invoice) =>
    matchesStatus(invoice, status)
  );
  const onlyRequested = requestedOnly === true || requestedOnly === 'true';
  const items = (await buildItems(invoices, settings)).filter(
    (item) =>
      matchesSearch(item, search) && (!onlyRequested || item.document.requested)
  );
  return { blocking: validateSettings(settings), items };
};
