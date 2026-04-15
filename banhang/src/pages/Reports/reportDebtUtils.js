import { formatMoney } from '../../utils/moneyFormat.js';

const PAYMENT_METHOD_LABELS = {
  cash: 'Tiền mặt',
  bank: 'Chuyển khoản',
  other: 'Khác',
};

export const formatDebtPaymentMethod = (value) =>
  PAYMENT_METHOD_LABELS[value] || value || '';

export const buildCustomerDebtExportRows = (rows = []) =>
  rows.map((row) => ({
    Khach_hang: row.customer?.name || '',
    Tong_ban: row.total,
    Thu_theo_hoa_don: row.invoicePaid,
    Thu_no_doc_lap: row.debtReceiptPaid,
    Da_thu: row.paid,
    Con_no: row.debt,
  }));

export const buildCustomerDebtTotals = (rows = []) =>
  rows.reduce(
    (acc, row) => ({
      total: acc.total + Number(row.total || 0),
      paid: acc.paid + Number(row.paid || 0),
      debt: acc.debt + Number(row.debt || 0),
    }),
    { total: 0, paid: 0, debt: 0 }
  );

export const buildCustomerDebtSummaryItems = (totals) => [
  {
    label: 'Tổng bán',
    value: formatMoney(totals.total),
    className: 'text-primary',
  },
  {
    label: 'Đã thu',
    value: formatMoney(totals.paid),
    className: 'text-success',
  },
  {
    label: 'Còn nợ',
    value: formatMoney(totals.debt),
    className: 'text-danger',
  },
];

export const buildSupplierDebtExportRows = (rows = []) =>
  rows.map((row) => ({
    Nha_cung_cap: row.supplier?.name || '',
    Tong_nhap: row.total,
    Tra_theo_phieu: row.purchasePaid,
    Tra_no_doc_lap: row.debtPaid,
    Da_tra: row.paid,
    Con_no: row.debt,
  }));
