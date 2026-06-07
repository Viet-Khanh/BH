import dayjs from 'dayjs';
import { formatMoney } from '../../utils/moneyFormat.js';

export const getPurchaseAmounts = (row) => {
  const amount = Number(row.amount ?? row.total ?? 0);
  const paid = Number(row.paid ?? 0);
  const oldDebt = Number(row.oldDebt ?? 0);
  const totalPay = Number(row.totalPay ?? amount + oldDebt);
  const remain = Number(row.remain ?? totalPay - paid);

  return {
    amount,
    oldDebt,
    paid,
    remain,
    totalPay,
  };
};

export const buildPurchaseInvoiceSummary = (rows = []) =>
  rows.reduce(
    (acc, row) => {
      const { amount, paid, remain } = getPurchaseAmounts(row);
      return {
        amount: acc.amount + amount,
        paid: acc.paid + paid,
        remain: acc.remain + remain,
      };
    },
    {
      amount: 0,
      paid: 0,
      remain: 0,
    }
  );

export const buildPurchaseInvoiceExportRow = (
  row,
  { formatted = false } = {}
) => {
  const { amount, paid, oldDebt, totalPay, remain } = getPurchaseAmounts(row);
  return {
    'Số HĐ': row.code,
    Ngày: row.date ? dayjs(row.date).format('DD/MM/YYYY HH:mm') : '',
    'Nhân viên': row.staff || '',
    MH: row.itemsCount ?? '',
    SL: row.qtySum ?? '',
    'Tiền hàng': formatted ? formatMoney(amount) : amount,
    'Đã thu': formatted ? formatMoney(paid) : paid,
    'Nợ cũ': formatted ? formatMoney(oldDebt) : oldDebt,
    'Tổng cộng': formatted ? formatMoney(totalPay) : totalPay,
    'Còn nợ': formatted ? formatMoney(remain) : remain,
    'Nhà cung cấp': row.supplierName || '',
    'Điện thoại': row.phone || '',
    'Địa chỉ': row.address || '',
    'Ghi chú': row.note || '',
  };
};

export const buildPurchaseInvoiceItems = (purchase, products = []) => {
  const productMap = products.reduce((acc, item) => {
    acc[item.id] = item;
    return acc;
  }, {});

  return (purchase?.items || []).map((item, index) => {
    const product = productMap[item.productId] || {};
    return {
      key: `${item.productId || 'item'}-${index}`,
      productId: item.productId,
      name: product.name || '',
      unit: product.unit || '',
      spec: product.spec || '',
      qty: item.qty,
      unitCost: item.unitCost,
      lineTotal: item.lineTotal,
      note: item.lineNote || '',
    };
  });
};
