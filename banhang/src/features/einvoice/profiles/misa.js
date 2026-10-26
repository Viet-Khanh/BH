// MISA meInvoice "Nhập khẩu hóa đơn một thuế suất" (VERIFIED from the template
// screenshot; https://helpv4.meinvoice.vn/kb/nhap-khau-hoa-don-mot-thue-suat/).
// Header on row 9. Rows with the same "Số thứ tự hóa đơn" form one invoice;
// rate and invoice tax only on its first row. MISA's import wizard lets the
// shop choose the header row and map columns, so small differences are fine.
const firstLine = (header, field, extra = {}) => ({
  header,
  field,
  firstLineOnly: true,
  ...extra,
});

export default {
  id: 'misa',
  name: 'MISA meInvoice (một thuế suất)',
  purpose: 'issue',
  sheetName: 'Sheet1',
  singleVatRate: true,
  source: {
    status: 'docs',
    url: 'https://helpv4.meinvoice.vn/kb/nhap-khau-hoa-don-mot-thue-suat/',
  },
  preamble: [
    ['File mẫu danh sách hóa đơn để nhập vào phần mềm'],
    [],
    [],
    [],
    [],
    [],
    [],
    [],
  ],
  columns: [
    { header: 'Số thứ tự hóa đơn (*)', field: 'invoiceSeq' },
    {
      header: 'Mã đơn vị lập hóa đơn (*)',
      field: 'constant',
      constant: '',
      prompt: 'mã đơn vị lập hoá đơn trên MISA',
    },
    firstLine('Ngày hóa đơn', 'date', { format: 'dmy' }),
    firstLine('Tên khách hàng', 'buyerDisplayName'),
    firstLine('Địa chỉ', 'buyerAddress'),
    firstLine('Mã số thuế', 'buyerTaxCode'),
    firstLine('Người mua hàng', 'buyerName'),
    firstLine('Email', 'buyerEmail'),
    firstLine('Hình thức thanh toán', 'paymentMethod', { format: 'text' }),
    firstLine('Thuế suất GTGT (%)', 'vatRate', { format: 'plain' }),
    firstLine('Tiền thuế GTGT', 'invoiceTax'),
    { header: 'Tên hàng hóa/dịch vụ (*)', field: 'itemName' },
    { header: 'ĐVT', field: 'unit' },
    { header: 'Số lượng', field: 'quantity' },
    { header: 'Đơn giá', field: 'unitPriceBeforeTax' },
    { header: 'Thành tiền', field: 'amountBeforeTax' },
  ],
};
