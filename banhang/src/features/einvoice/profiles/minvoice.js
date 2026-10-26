// M-Invoice "Nhận excel" template (PARTIAL: some headers were cut off in the
// public screenshot; https://support-minvoice.tawk.help/article/huong-dan-nhan-excel-hang-loat-hoa-don-78).
// Rows with the same "Số đơn hàng" form one invoice.
const empty = (header) => ({ header, field: 'empty' });

export default {
  id: 'minvoice',
  name: 'M-Invoice',
  purpose: 'issue',
  sheetName: 'Sheet1',
  source: {
    status: 'partial',
    url: 'https://support-minvoice.tawk.help/article/huong-dan-nhan-excel-hang-loat-hoa-don-78',
  },
  columns: [
    {
      header: 'Ký hiệu',
      field: 'constant',
      constant: '',
      prompt: 'ký hiệu hoá đơn đang dùng, ví dụ 1C26TAA',
    },
    { header: 'Số đơn hàng', field: 'appCode' },
    { header: 'Ngày hóa đơn', field: 'date', format: 'dmy' },
    { header: 'Tiền tệ', field: 'constant', constant: 'VND' },
    { header: 'Tên người mua', field: 'buyerName' },
    empty('Mã người mua'),
    { header: 'Tên đơn vị mua', field: 'companyName' },
    { header: 'Mã số thuế', field: 'buyerTaxCode' },
    { header: 'Địa chỉ', field: 'buyerAddress' },
    { header: 'HTTT', field: 'paymentMethod', format: 'code' },
    { header: 'Email', field: 'buyerEmail' },
    empty('Tỷ giá'),
    empty('STK ngân hàng'),
    empty('Ngân hàng'),
    { header: 'Tính chất', field: 'constant', constant: '1' },
    { header: 'Số thứ tự', field: 'lineIndex' },
    { header: 'Mã hàng', field: 'itemCode' },
    { header: 'Tên hàng', field: 'itemName' },
    { header: 'Đơn vị tính', field: 'unit' },
    { header: 'Số lượng', field: 'quantity' },
    { header: 'Đơn giá', field: 'unitPriceBeforeTax' },
    { header: 'Thành tiền trước thuế', field: 'amountBeforeTax' },
    empty('PT chiết khấu'),
    empty('Tiền CK'),
    { header: 'Thuế', field: 'vatRate', format: 'easyinvoice' },
    { header: 'Tiền thuế', field: 'tax' },
    { header: 'Tổng tiền', field: 'amount' },
  ],
};
