// Export state of an invoice as shown in the e-invoice screen.
export const STATUSES = ['pending', 'exported', 'changed', 'all'];

export const einvoiceStatus = (invoice) => {
  if (invoice.einvoice?.changedAfterExport) return 'changed';
  return invoice.einvoice?.exportedAt ? 'exported' : 'pending';
};

// Bad request input (mapped to HTTP 400 by the controller).
export class EinvoiceInputError extends Error {}
