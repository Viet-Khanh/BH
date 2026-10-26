// "Chuẩn BanHang": readable, complete layout. One row per line; invoice
// columns repeat on every row.
export const GENERIC_COLUMNS = [
  { header: 'Mã HĐ (app)', field: 'appCode' },
  { header: 'Ngày HĐ', field: 'date', format: 'dmy' },
  { header: 'Tên người mua', field: 'buyerName' },
  { header: 'Tên đơn vị', field: 'companyName' },
  { header: 'MST người mua', field: 'buyerTaxCode' },
  { header: 'Địa chỉ', field: 'buyerAddress' },
  { header: 'Email', field: 'buyerEmail' },
  { header: 'Hình thức TT', field: 'paymentMethod', format: 'code' },
  { header: 'STT', field: 'lineIndex' },
  { header: 'Mã hàng', field: 'itemCode' },
  { header: 'Tên hàng', field: 'itemName' },
  { header: 'ĐVT', field: 'unit' },
  { header: 'Số lượng', field: 'quantity' },
  { header: 'Đơn giá', field: 'unitPrice' },
  {
    header: 'Thành tiền chưa thuế',
    field: 'amountBeforeTax',
    onlyFor: 'deduction',
  },
  {
    header: 'Thuế suất',
    field: 'vatRate',
    format: 'percent',
    onlyFor: 'deduction',
  },
  { header: 'Tiền thuế', field: 'tax', onlyFor: 'deduction' },
  { header: 'Thành tiền', field: 'amount' },
  { header: 'Chiết khấu HĐ', field: 'discount' },
  { header: 'Ghi chú', field: 'lineNote' },
];

export default {
  id: 'generic',
  name: 'Chuẩn BanHang (đủ trường, dễ đọc)',
  purpose: 'issue',
  sheetName: 'HoaDon',
  columns: GENERIC_COLUMNS,
};
