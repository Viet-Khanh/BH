import { money, VAT_FORMATS } from './formats.js';

// Fields with one value per invoice line.
export const LINE_FIELDS = [
  { key: 'lineIndex', label: 'STT dòng', value: ({ line }) => line.index },
  { key: 'itemCode', label: 'Mã hàng', value: ({ line }) => line.code },
  { key: 'itemName', label: 'Tên hàng', value: ({ line }) => line.name },
  { key: 'unit', label: 'Đơn vị tính', value: ({ line }) => line.unit },
  { key: 'quantity', label: 'Số lượng', value: ({ line }) => line.quantity },
  {
    key: 'unitPrice',
    label: 'Đơn giá (giá bán)',
    value: ({ line }) => line.unitPrice,
  },
  {
    key: 'unitPriceBeforeTax',
    label: 'Đơn giá trước thuế',
    value: ({ line }) => line.unitPriceBeforeTax ?? line.unitPrice,
  },
  {
    key: 'amount',
    label: 'Thành tiền (giá bán)',
    value: ({ line }) => money(line.amount),
  },
  {
    key: 'amountBeforeTax',
    label: 'Thành tiền trước thuế',
    value: ({ line }) => money(line.beforeTax ?? line.amount),
  },
  {
    key: 'vatRate',
    label: 'Thuế suất',
    formats: VAT_FORMATS,
    value: ({ line }, format) => format(line.vatRate),
  },
  { key: 'tax', label: 'Tiền thuế dòng', value: ({ line }) => money(line.tax) },
  { key: 'lineNote', label: 'Ghi chú dòng', value: ({ line }) => line.note },
];
