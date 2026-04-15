import dayjs from 'dayjs';
import { formatMoney } from '../../utils/moneyFormat.js';

export const normalizePurchaseDetailRow = (
  row = {},
  supplier = {},
  items = []
) => {
  const amount = Number(row.amount ?? row.total ?? 0);
  const paid = Number(row.paid ?? 0);
  const oldDebt = Number(row.oldDebt ?? 0);
  const totalPay = Number(row.totalPay ?? amount + oldDebt);
  const remain = Number(row.remain ?? totalPay - paid);
  const qtySumFromItems = items.reduce(
    (sum, item) => sum + Number(item.qty || 0),
    0
  );

  return {
    id: row.id || `${row.code || ''}-${row.date || ''}`,
    code: row.code || '',
    date: row.date || '',
    staff: row.staff || '',
    supplierName: row.supplierName || supplier.name || '',
    phone: row.phone || supplier.phone || '',
    address: row.address || supplier.address || '',
    itemsCount: row.itemsCount ?? items.length,
    qtySum: row.qtySum ?? qtySumFromItems,
    amount,
    paid,
    oldDebt,
    totalPay,
    remain,
    note: row.note || '',
    items,
  };
};

export const buildPurchaseDetailsSummary = (rows = []) =>
  rows.reduce(
    (acc, row) => ({
      amount: acc.amount + Number(row.amount || 0),
      paid: acc.paid + Number(row.paid || 0),
      remain: acc.remain + Number(row.remain || 0),
      totalPay: acc.totalPay + Number(row.totalPay || 0),
    }),
    {
      amount: 0,
      paid: 0,
      remain: 0,
      totalPay: 0,
    }
  );

export const buildPurchaseDetailExportRow = (
  row,
  item,
  { formatted = false, includeInvoiceInfo = true } = {}
) => {
  const invoiceFields = includeInvoiceInfo
    ? {
        'Số HĐ': row.code,
        Ngày: row.date ? dayjs(row.date).format('DD/MM/YYYY HH:mm') : '',
        'Nhân viên': row.staff || '',
        'Nhà cung cấp': row.supplierName || '',
        'Điện thoại': row.phone || '',
        'Địa chỉ': row.address || '',
        MH: row.itemsCount ?? '',
        'Tổng SL': row.qtySum ?? '',
        'Tiền hàng': formatted ? formatMoney(row.amount) : row.amount,
        'Đã thu': formatted ? formatMoney(row.paid) : row.paid,
        'Nợ cũ': formatted ? formatMoney(row.oldDebt) : row.oldDebt,
        'Tổng cộng': formatted ? formatMoney(row.totalPay) : row.totalPay,
        'Còn nợ': formatted ? formatMoney(row.remain) : row.remain,
        'Ghi chú': row.note || '',
      }
    : {
        'Số HĐ': '',
        Ngày: '',
        'Nhân viên': '',
        'Nhà cung cấp': '',
        'Điện thoại': '',
        'Địa chỉ': '',
        MH: '',
        'Tổng SL': '',
        'Tiền hàng': '',
        'Đã thu': '',
        'Nợ cũ': '',
        'Tổng cộng': '',
        'Còn nợ': '',
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
        ? formatMoney(item.unitCost ?? 0)
        : ''
      : (item?.unitCost ?? ''),
    'Thành tiền': formatted
      ? item
        ? formatMoney(item.lineTotal ?? 0)
        : ''
      : (item?.lineTotal ?? ''),
    'Ghi chú hàng': item?.note || '',
  };
};

export const groupPurchaseDetailRows = ({
  rows = [],
  detailRows = [],
  supplierMap = {},
}) => {
  const itemsByCode = {};
  detailRows.forEach((row) => {
    const code = row.Ma_phieu || '';
    if (!code) return;
    if (!itemsByCode[code]) itemsByCode[code] = [];
    itemsByCode[code].push({
      key: `${code}-${itemsByCode[code].length}`,
      name: row.San_pham || '',
      unit: row.DVT || '',
      spec: row.Quy_cach || '',
      qty: row.So_luong ?? '',
      unitCost: row.Don_gia ?? '',
      lineTotal: row.Thanh_tien ?? '',
      note: row.Ghi_chu_hang || '',
    });
  });

  const normalizedRows = rows.map((row) =>
    normalizePurchaseDetailRow(
      row,
      supplierMap[row.supplierId] || {},
      itemsByCode[row.code] || []
    )
  );

  const existingCodes = new Set(normalizedRows.map((row) => row.code));
  const fallbackRowsByCode = detailRows.reduce((acc, row) => {
    const code = row.Ma_phieu || '';
    if (!code || existingCodes.has(code)) return acc;
    if (!acc[code]) {
      acc[code] = normalizePurchaseDetailRow(
        {
          id: `fallback-${code}`,
          code,
          supplierName: row.Nha_cung_cap || '',
        },
        {},
        []
      );
    }
    const item = {
      key: `${code}-${acc[code].items.length}`,
      name: row.San_pham || '',
      unit: row.DVT || '',
      spec: row.Quy_cach || '',
      qty: row.So_luong ?? '',
      unitCost: row.Don_gia ?? '',
      lineTotal: row.Thanh_tien ?? '',
      note: row.Ghi_chu_hang || '',
    };
    acc[code].items.push(item);
    acc[code].itemsCount = acc[code].items.length;
    acc[code].qtySum += Number(item.qty || 0);
    acc[code].amount += Number(item.lineTotal || 0);
    acc[code].totalPay = acc[code].amount;
    return acc;
  }, {});

  return [...normalizedRows, ...Object.values(fallbackRowsByCode)];
};

export const buildPurchaseDetailsExportRows = ({
  rows = [],
  formatted = false,
}) =>
  rows.flatMap((row) => {
    const items = row.items?.length ? row.items : [null];
    return items.map((item, index) =>
      buildPurchaseDetailExportRow(row, item, {
        formatted,
        includeInvoiceInfo: index === 0,
      })
    );
  });
