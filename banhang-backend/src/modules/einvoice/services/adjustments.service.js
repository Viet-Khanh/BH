import { adjustmentEntry } from '../domain/adjustment.js';
import { setInvoiceEinvoiceFields } from '../repositories/einvoice.repository.js';
import { loadItemsByIds, newBatch, requireIds } from './exportState.service.js';

const hasErrors = (adjustment) =>
  adjustment.issues.some((issue) => issue.level === 'error');

// After the adjustment file is saved: keep history and reset the state.
// Replace → the new invoice gets its own number later (number fields cleared,
// snapshot = current content). Reduce (deleted sale) → done, number kept.
const fieldsAfter = (item, entry, { at, batchId }) => {
  const history = [...(item.einvoice?.adjustments || []), entry];
  const common = {
    'einvoice.adjustments': history,
    'einvoice.changedAfterExport': false,
  };
  if (item.adjustment.kind === 'reduce') return common;
  return {
    ...common,
    'einvoice.exportedAt': at,
    'einvoice.exportBatchId': batchId,
    'einvoice.snapshot': item.document,
    'einvoice.number': null,
    'einvoice.series': null,
    'einvoice.taxAuthorityCode': null,
    'einvoice.lookupCode': null,
  };
};

export const markAdjusted = async ({ invoiceIds, profile }) => {
  requireIds(invoiceIds);
  const batch = { ...newBatch('ED'), profile: profile || 'generic-adjust' };
  const items = (await loadItemsByIds(invoiceIds)).filter(
    (item) => item.status === 'changed' && !hasErrors(item.adjustment)
  );
  await Promise.all(
    items.map((item) =>
      setInvoiceEinvoiceFields(
        item.invoiceId,
        fieldsAfter(item, adjustmentEntry(item.adjustment, batch), batch)
      )
    )
  );
  return { batchId: batch.batchId, count: items.length };
};
