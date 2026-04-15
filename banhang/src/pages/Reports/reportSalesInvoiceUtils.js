import dayjs from 'dayjs';
import { formatMoney } from '../../utils/moneyFormat.js';

export const EMPTY_DEBT_TIMELINE = {
  openingBalance: 0,
  closingBalance: 0,
  rows: [],
};

export const buildSalesInvoiceReportSummary = (
  items = [],
  { timelineMode = false } = {}
) =>
  items.reduce(
    (acc, row) => {
      const isDebtReceipt = row.rowType === 'debt_receipt';
      acc.amount += isDebtReceipt ? 0 : Number(row.amount || 0);
      acc.paid += Number(row.paid || 0);
      acc.remain += timelineMode ? 0 : Number(row.remain || 0);
      acc.profit += isDebtReceipt ? 0 : Number(row.profit || 0);
      return acc;
    },
    {
      amount: 0,
      paid: 0,
      remain:
        timelineMode && items.length
          ? Number(items[items.length - 1]?.remain || 0)
          : 0,
      profit: 0,
    }
  );

export const buildSalesInvoiceExportRow = (
  row,
  { formatted = false, includeProfit = true } = {}
) => {
  const isDebtReceipt = row.rowType === 'debt_receipt';
  const blank = '';
  return {
    'Số HĐ': isDebtReceipt ? blank : row.code,
    Ngày: row.date ? dayjs(row.date).format('DD/MM/YYYY HH:mm') : '',
    'Nhân viên': isDebtReceipt ? blank : row.staff,
    'Mặt hàng': isDebtReceipt ? blank : row.itemsCount,
    'Số lượng': isDebtReceipt ? blank : row.qtySum,
    'Tiền hàng': isDebtReceipt
      ? blank
      : formatted
        ? formatMoney(row.amount)
        : row.amount,
    'Đã thu': formatted ? formatMoney(row.paid) : Number(row.paid || 0),
    ...(includeProfit
      ? {
          'Lợi nhuận': isDebtReceipt
            ? blank
            : formatted
              ? formatMoney(row.profit)
              : row.profit,
        }
      : {}),
    'Nợ cũ': formatted ? formatMoney(row.oldDebt) : Number(row.oldDebt || 0),
    'Tổng cộng': isDebtReceipt
      ? blank
      : formatted
        ? formatMoney(row.totalPay)
        : row.totalPay,
    'Còn nợ': formatted ? formatMoney(row.remain) : Number(row.remain || 0),
    'Khách hàng': isDebtReceipt ? blank : row.customerName,
    'Điện thoại': isDebtReceipt ? blank : row.phone,
    'Địa chỉ': isDebtReceipt ? blank : row.address,
    'Ghi chú': isDebtReceipt ? blank : row.note,
  };
};

export const buildSalesInvoiceDisplayRows = ({
  rows = [],
  debtTimelineRows = [],
  customerId,
  page = 1,
  pageSize = 20,
}) => {
  const invoiceRows = rows.map((row) => ({ ...row, rowType: 'invoice' }));
  if (!customerId || !debtTimelineRows.length) {
    return invoiceRows;
  }

  const invoiceRowsById = new Map(invoiceRows.map((row) => [row.id, row]));
  const timelineRows = debtTimelineRows.filter(
    (row) => row.type === 'invoice' || row.type === 'debt_receipt'
  );
  if (!timelineRows.length) {
    return invoiceRows;
  }

  const mergedRows = [];
  let invoicePosition = 0;

  for (const timelineRow of timelineRows) {
    if (timelineRow.type === 'invoice') {
      invoicePosition += 1;
      const invoiceId = String(timelineRow.id || '').replace(/^invoice:/, '');
      const invoiceRow = invoiceRowsById.get(invoiceId);
      if (invoiceRow) {
        mergedRows.push(invoiceRow);
      }
      continue;
    }

    const receiptPage =
      invoicePosition > 0 ? Math.ceil(invoicePosition / pageSize) : 1;
    if (receiptPage !== page) {
      continue;
    }

    mergedRows.push({
      id: timelineRow.id,
      rowType: 'debt_receipt',
      date: timelineRow.date,
      paid: Number(timelineRow.paid || 0),
      oldDebt: Number(timelineRow.oldDebt || 0),
      remain: Number(timelineRow.remain || 0),
    });
  }

  return mergedRows.length ? mergedRows : invoiceRows;
};
