import { EinvoiceInputError } from '../domain/status.js';
import {
  setEinvoiceNumber,
  updateEinvoiceFields,
} from '../repositories/einvoice.repository.js';

// Export bookkeeping: mark/unmark invoices as exported, store provider numbers.
const requireIds = (invoiceIds) => {
  if (
    !Array.isArray(invoiceIds) ||
    !invoiceIds.length ||
    invoiceIds.some((id) => !id)
  ) {
    throw new EinvoiceInputError('Danh sách hoá đơn không hợp lệ.');
  }
};

export const markExported = async ({ invoiceIds, profile }) => {
  requireIds(invoiceIds);
  const exportedAt = new Date().toISOString();
  const batchId = `EI-${exportedAt.replace(/\D/g, '').slice(0, 14)}`;
  const result = await updateEinvoiceFields(invoiceIds, {
    'einvoice.exportedAt': exportedAt,
    'einvoice.exportBatchId': batchId,
    'einvoice.profile': profile || 'generic',
    'einvoice.changedAfterExport': false,
  });
  return {
    batchId,
    exportedAt,
    count: result.matchedCount ?? invoiceIds.length,
  };
};

export const unmarkExported = async ({ invoiceIds }) => {
  requireIds(invoiceIds);
  const result = await updateEinvoiceFields(invoiceIds, {
    'einvoice.exportedAt': null,
    'einvoice.exportBatchId': null,
    'einvoice.profile': null,
    'einvoice.number': null,
    'einvoice.changedAfterExport': false,
  });
  return { count: result.matchedCount ?? invoiceIds.length };
};

export const setNumber = async (invoiceId, number) => {
  const invoice = await setEinvoiceNumber(
    invoiceId,
    String(number || '').trim()
  );
  if (!invoice) throw new EinvoiceInputError('Không tìm thấy hoá đơn.');
  return invoice.einvoice;
};
