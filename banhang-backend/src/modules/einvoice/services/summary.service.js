import { EinvoiceInputError, matchesStatus } from '../domain/status.js';
import { findRealSales } from './documents.service.js';

const FAR_FUTURE = '9999-12-31T23:59:59.999Z';

// Counts for the Home reminder; `since` = start of e-invoice use (or a recent
// window), `todayStart` = local start of today as ISO (sent by the client).
export const getSummary = async ({ since, todayStart }) => {
  if (!since || !todayStart)
    throw new EinvoiceInputError('Thiếu tham số since, todayStart.');
  const invoices = await findRealSales({ from: since, to: FAR_FUTURE });
  const count = (status, predicate = () => true) =>
    invoices.filter(
      (invoice) => matchesStatus(invoice, status) && predicate(invoice)
    ).length;
  return {
    pendingToday: count('pending', (invoice) => invoice.date >= todayStart),
    pendingEarlier: count('pending', (invoice) => invoice.date < todayStart),
    changed: count('changed'),
    unnumbered: count('unnumbered'),
  };
};
