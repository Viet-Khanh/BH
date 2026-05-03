import { printHtml } from '../../utils/printUtils.js';
import { renderDebtReceiptTemplate } from '../../utils/renderDebtReceiptTemplate.js';

export const findDebtReceiptTimelineRow = (rows = [], paymentId) =>
  rows.find((row) => row.id === `debt-receipt:${paymentId}`) || null;

export const printDebtReceiptDocument = async ({
  payment,
  customer,
  settings,
  timelineRow,
  copies,
}) => {
  if (!payment || !customer) return;
  const html = renderDebtReceiptTemplate({
    receipt: payment,
    customer,
    settings,
    debtBefore: Number(timelineRow?.oldDebt || 0),
  });
  const printCopies = Math.max(
    1,
    Math.round(Number(copies ?? settings?.printCopies ?? 1))
  );
  await printHtml(html, { copies: printCopies, autoPageSize: true });
};

export const refreshDebtReceiptContext = async ({
  customerId,
  loadDebtRows,
  loadDebtDetail,
  loadDebtTimeline,
}) => {
  const [, nextDetail, nextTimelineRows] = await Promise.all([
    loadDebtRows(),
    loadDebtDetail(customerId),
    loadDebtTimeline(customerId),
  ]);

  return {
    nextDetail,
    nextTimelineRows,
  };
};
