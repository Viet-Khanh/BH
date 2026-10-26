import { buildRevenueReport } from '../domain/revenueReport.js';
import { EinvoiceInputError } from '../domain/status.js';
import { resolveTaxSettings } from '../domain/documentBuilder.js';
import { findRealSales, requireRange } from './documents.service.js';
import { buildItems, loadSettings } from './documentItems.js';

const GROUPS = ['month', 'quarter'];

export const getRevenueReport = async ({
  from,
  to,
  groupBy = 'month',
  utcOffsetMinutes = 420,
}) => {
  requireRange({ from, to });
  if (!GROUPS.includes(groupBy))
    throw new EinvoiceInputError(`Cách nhóm không hợp lệ: ${groupBy}`);
  const settings = await loadSettings();
  const invoices = (await findRealSales({ from, to })).filter(
    (invoice) => !invoice.isDeleted
  );
  const report = buildRevenueReport(await buildItems(invoices, settings), {
    groupBy,
    utcOffsetMinutes: Number(utcOffsetMinutes),
  });
  return { taxMethod: resolveTaxSettings(settings).taxMethod, ...report };
};
