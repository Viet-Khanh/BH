import { EinvoiceInputError } from '../domain/status.js';
import {
  findInvoicesByIds,
  setInvoiceEinvoiceFields,
  updateEinvoiceFields,
} from '../repositories/einvoice.repository.js';
import { buildItems, loadSettings, publicEinvoice } from './documentItems.js';

// Export bookkeeping: mark/unmark invoices as exported, store provider numbers.
export const requireIds = (invoiceIds) => {
  if (
    !Array.isArray(invoiceIds) ||
    !invoiceIds.length ||
    invoiceIds.some((id) => !id)
  ) {
    throw new EinvoiceInputError('Danh sách hoá đơn không hợp lệ.');
  }
};

export const newBatch = (prefix) => {
  const at = new Date().toISOString();
  return { at, batchId: `${prefix}-${at.replace(/\D/g, '').slice(0, 14)}` };
};

// Documents rebuilt server-side for the given invoices (never trusted from the client).
export const loadItemsByIds = async (invoiceIds) =>
  buildItems(await findInvoicesByIds(invoiceIds), await loadSettings());

// Each invoice keeps a snapshot of its exported document (see documentDiff).
export const markExported = async ({ invoiceIds, profile }) => {
  requireIds(invoiceIds);
  const { at: exportedAt, batchId } = newBatch('EI');
  const items = await loadItemsByIds(invoiceIds);
  await Promise.all(
    items.map((item) =>
      setInvoiceEinvoiceFields(item.invoiceId, {
        'einvoice.exportedAt': exportedAt,
        'einvoice.exportBatchId': batchId,
        'einvoice.profile': profile || 'generic',
        'einvoice.changedAfterExport': false,
        'einvoice.snapshot': item.document,
      })
    )
  );
  return { batchId, exportedAt, count: items.length };
};

export const unmarkExported = async ({ invoiceIds }) => {
  requireIds(invoiceIds);
  const result = await updateEinvoiceFields(invoiceIds, {
    'einvoice.exportedAt': null,
    'einvoice.exportBatchId': null,
    'einvoice.profile': null,
    'einvoice.number': null,
    'einvoice.series': null,
    'einvoice.taxAuthorityCode': null,
    'einvoice.lookupCode': null,
    'einvoice.snapshot': null,
    'einvoice.changedAfterExport': false,
  });
  return { count: result.matchedCount ?? invoiceIds.length };
};

const ISSUED_FIELDS = ['number', 'series', 'taxAuthorityCode', 'lookupCode'];

// Provider data of an issued invoice; only the fields present are changed.
export const issuedFieldsPatch = (values = {}) =>
  Object.fromEntries(
    ISSUED_FIELDS.filter((field) => values[field] !== undefined).map(
      (field) => [`einvoice.${field}`, String(values[field] ?? '').trim()]
    )
  );

export const setNumber = async (invoiceId, values) => {
  const patch = issuedFieldsPatch(values);
  if (!Object.keys(patch).length)
    throw new EinvoiceInputError('Thiếu số hoá đơn.');
  const invoice = await setInvoiceEinvoiceFields(invoiceId, patch);
  if (!invoice) throw new EinvoiceInputError('Không tìm thấy hoá đơn.');
  return publicEinvoice(invoice.einvoice);
};
