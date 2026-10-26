// Export state of an invoice as shown in the e-invoice screen.
export const einvoiceStatus = (invoice) => {
  if (invoice.einvoice?.changedAfterExport) return 'changed';
  return invoice.einvoice?.exportedAt ? 'exported' : 'pending';
};

// List filters: the three states, `all`, and `unnumbered` (exported but the
// provider's invoice number is not recorded yet — the reconciliation view).
const FILTERS = {
  all: () => true,
  pending: (invoice) => einvoiceStatus(invoice) === 'pending',
  exported: (invoice) => einvoiceStatus(invoice) === 'exported',
  changed: (invoice) => einvoiceStatus(invoice) === 'changed',
  unnumbered: (invoice) =>
    einvoiceStatus(invoice) === 'exported' &&
    !invoice.isDeleted &&
    !invoice.einvoice?.number,
};

export const STATUSES = Object.keys(FILTERS);

export const matchesStatus = (invoice, status) => FILTERS[status](invoice);

// Bad request input (mapped to HTTP 400 by the controller).
export class EinvoiceInputError extends Error {}
