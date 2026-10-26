import dayjs from 'dayjs';

const DEFAULT_WINDOW_DAYS = 30;

// Only shops that issue e-invoices (seller tax code set) get the reminder.
export const isReminderEnabled = (settings = {}) =>
  Boolean(String(settings.sellerTaxCode || '').trim()) &&
  settings.einvoiceReminder !== false;

// Sales older than the start of e-invoice use are ignored; without a start
// date only the last 30 days count.
export const reminderRange = (settings = {}, now = dayjs()) => ({
  since: settings.einvoiceStartDate
    ? dayjs(settings.einvoiceStartDate).toISOString()
    : now.subtract(DEFAULT_WINDOW_DAYS, 'day').startOf('day').toISOString(),
  todayStart: now.startOf('day').toISOString(),
});

// Short phrases for the reminder line; empty when there is nothing to do.
export const reminderParts = (summary) => {
  if (!summary) return [];
  const parts = [];
  const pending = summary.pendingToday + summary.pendingEarlier;
  if (pending) {
    const earlier = summary.pendingEarlier
      ? ` (${summary.pendingEarlier} của các ngày trước)`
      : '';
    parts.push(`${pending} hoá đơn chưa xuất HĐĐT${earlier}`);
  }
  if (summary.changed)
    parts.push(`${summary.changed} hoá đơn sửa sau khi xuất`);
  if (summary.unnumbered)
    parts.push(`${summary.unnumbered} hoá đơn đã xuất chưa có số`);
  return parts;
};
