import dayjs from 'dayjs';
import { formatVatRate } from '../domain/vatRates.js';

const money = (value) =>
  value === undefined || value === null ? '' : Math.round(Number(value));

// "Chuẩn BanHang": readable, complete layout. One row per line; invoice
// columns repeat on every row. Provider profiles follow the same contract.
export default {
  id: 'generic',
  name: 'Chuẩn BanHang (đủ trường, dễ đọc)',
  sheetName: 'HoaDon',
  columns: [
    { header: 'Mã HĐ (app)', value: (doc) => doc.code },
    { header: 'Ngày HĐ', value: (doc) => dayjs(doc.date).format('DD/MM/YYYY') },
    { header: 'Tên người mua', value: (doc) => doc.buyer.name },
    { header: 'Tên đơn vị', value: (doc) => doc.buyer.companyName },
    { header: 'MST người mua', value: (doc) => doc.buyer.taxCode },
    { header: 'Địa chỉ', value: (doc) => doc.buyer.address },
    { header: 'Email', value: (doc) => doc.buyer.email },
    { header: 'Hình thức TT', value: (doc) => doc.paymentMethod },
    { header: 'STT', value: (doc, line) => line.index },
    { header: 'Mã hàng', value: (doc, line) => line.code },
    { header: 'Tên hàng', value: (doc, line) => line.name },
    { header: 'ĐVT', value: (doc, line) => line.unit },
    { header: 'Số lượng', value: (doc, line) => line.quantity },
    { header: 'Đơn giá', value: (doc, line) => line.unitPrice },
    {
      header: 'Thành tiền chưa thuế',
      onlyFor: 'deduction',
      value: (doc, line) => money(line.beforeTax),
    },
    {
      header: 'Thuế suất',
      onlyFor: 'deduction',
      value: (doc, line) => formatVatRate(line.vatRate),
    },
    {
      header: 'Tiền thuế',
      onlyFor: 'deduction',
      value: (doc, line) => money(line.tax),
    },
    { header: 'Thành tiền', value: (doc, line) => money(line.amount) },
    {
      header: 'Chiết khấu HĐ',
      // Invoice-level discount: written once, on the first line.
      value: (doc, line, lineIndex) =>
        lineIndex === 0 && doc.discount ? money(doc.discount) : '',
    },
    { header: 'Ghi chú', value: (doc, line) => line.note },
  ],
};
