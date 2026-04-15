import dayjs from 'dayjs';
import { formatMoney } from '../../utils/moneyFormat.js';

export const buildSalesDetailsSummary = (rows = []) =>
  rows.reduce(
    (acc, row) => ({
      amount: acc.amount + Number(row.amount || 0),
      paid: acc.paid + Number(row.paid || 0),
      remain: acc.remain + Number(row.remain || 0),
      profit: acc.profit + Number(row.profit || 0),
    }),
    {
      amount: 0,
      paid: 0,
      remain: 0,
      profit: 0,
    }
  );

export const buildSalesDetailsExportRow = (
  row,
  item,
  { formatted = false, includeInvoiceInfo = true, includeProfit = true } = {}
) => {
  const invoiceFields = includeInvoiceInfo
    ? {
        'Số HĐ': row.code,
        Ngày: row.date ? dayjs(row.date).format('DD/MM/YYYY HH:mm') : '',
        'Nhân viên': row.staff,
        'Khách hàng': row.customerName,
        'Điện thoại': row.phone,
        'Địa chỉ': row.address,
        MH: row.itemsCount,
        'Tổng SL': row.qtySum,
        'Tiền hàng': formatted ? formatMoney(row.amount) : row.amount,
        'Đã thu': formatted ? formatMoney(row.paid) : row.paid,
        'Nợ cũ': formatted ? formatMoney(row.oldDebt) : row.oldDebt,
        'Tổng cộng': formatted ? formatMoney(row.totalPay) : row.totalPay,
        'Còn nợ': formatted ? formatMoney(row.remain) : row.remain,
        ...(includeProfit
          ? { 'Lợi nhuận': formatted ? formatMoney(row.profit) : row.profit }
          : {}),
        'Ghi chú': row.note,
      }
    : {
        'Số HĐ': '',
        Ngày: '',
        'Nhân viên': '',
        'Khách hàng': '',
        'Điện thoại': '',
        'Địa chỉ': '',
        MH: '',
        'Tổng SL': '',
        'Tiền hàng': '',
        'Đã thu': '',
        'Nợ cũ': '',
        'Tổng cộng': '',
        'Còn nợ': '',
        ...(includeProfit ? { 'Lợi nhuận': '' } : {}),
        'Ghi chú': '',
      };

  return {
    ...invoiceFields,
    'Tên hàng': item?.name || '',
    ĐVT: item?.unit || '',
    'Quy cách': item?.spec || '',
    SL: item?.qty ?? '',
    'Đơn giá': formatted
      ? item
        ? formatMoney(item.unitPrice ?? 0)
        : ''
      : (item?.unitPrice ?? ''),
    'Thành tiền': formatted
      ? item
        ? formatMoney(item.lineTotal ?? 0)
        : ''
      : (item?.lineTotal ?? ''),
    'Ghi chú hàng': item?.note || '',
  };
};

export const buildSalesDetailsExportRows = ({
  rows = [],
  showSensitiveInfo = false,
  formatted = false,
}) =>
  rows.flatMap((row) => {
    const items = row.items?.length ? row.items : [null];
    return items.map((item, index) =>
      buildSalesDetailsExportRow(row, item, {
        formatted,
        includeInvoiceInfo: index === 0,
        includeProfit: showSensitiveInfo,
      })
    );
  });
