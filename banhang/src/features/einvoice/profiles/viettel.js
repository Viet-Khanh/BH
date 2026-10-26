// Viettel S-Invoice "Import hóa đơn" template (VERIFIED from the official
// template screenshots; https://www.s-invoice.vn/2026/02/lap-hoa-don-theo-file-sinvoice-viettel.html).
// Header on row 9, field keys on row 10, data from row 11. Rows with the same
// "Nhóm hóa đơn" form one invoice. No invoice-date column (dated on issue).
const empty = (header, subHeader = '') => ({
  header,
  subHeader,
  field: 'empty',
});

export default {
  id: 'viettel',
  name: 'Viettel S-Invoice',
  purpose: 'issue',
  sheetName: 'Thông tin hóa đơn',
  source: {
    status: 'docs',
    url: 'https://www.s-invoice.vn/2026/02/lap-hoa-don-theo-file-sinvoice-viettel.html',
  },
  preamble: [['TEMPLATE IMPORT HÓA ĐƠN'], [], [], [], [], [], [], []],
  columns: [
    { header: 'STT', subHeader: 'itemNo', field: 'lineIndex' },
    { header: 'Nhóm hóa đơn (*)', subHeader: 'group', field: 'appCode' },
    empty('Người mua không lấy HĐ'),
    empty('Mã KH', 'buyerCode'),
    { header: 'Họ tên', subHeader: 'buyerName', field: 'buyerName' },
    { header: 'Địa chỉ', subHeader: 'buyerAddress', field: 'buyerAddress' },
    { header: 'Số điện thoại', subHeader: 'buyerPhone', field: 'buyerPhone' },
    { header: 'Email', subHeader: 'buyerEmail', field: 'buyerEmail' },
    { header: 'Mã số thuế', subHeader: 'buyerTaxCode', field: 'buyerTaxCode' },
    empty('Mã đơn vị quan hệ ngân sách', 'budgetaryUnitCode'),
    empty('Loại giấy tờ', 'buyerIdType'),
    empty('Số giấy tờ', 'buyerIdNo'),
    { header: 'Tên đơn vị', subHeader: 'buyerLegalName', field: 'companyName' },
    empty('Tên ngân hàng', 'buyerBankName'),
    empty('Tài khoản ngân hàng', 'buyerBankAccount'),
    empty('Hợp đồng số', 'contactNo'),
    empty('Mã cửa hàng', 'storeCode'),
    empty('Tên cửa hàng', 'storeName'),
    {
      header: 'Hình thức thanh toán (*)',
      subHeader: 'payMethod',
      field: 'paymentMethod',
      format: 'code',
    },
    {
      header: 'Thanh toán (*)',
      subHeader: 'payStatus',
      field: 'constant',
      constant: '1',
    },
    {
      header: 'Loại tiền (*)',
      subHeader: 'currencyCode',
      field: 'constant',
      constant: 'VND',
    },
    empty('Tỷ giá', 'exchangeRate'),
    empty('Số bảng kê', 'detailedListNo'),
    empty('Ngày bảng kê', 'detailedListDate'),
    {
      header: 'Loại hàng hóa',
      subHeader: 'selection',
      field: 'constant',
      constant: '1',
    },
    empty('Loại hàng hoá đặc trưng', 'itemType'),
    { header: 'Mã hàng hóa/dịch vụ', subHeader: 'itemCode', field: 'itemCode' },
    {
      header: 'Tên hàng hóa/dịch vụ (*)',
      subHeader: 'itemName',
      field: 'itemName',
    },
    { header: 'Ghi chú', subHeader: 'itemNote', field: 'lineNote' },
    empty('Số lô', 'batchNo'),
    empty('Hạn dùng', 'expDate'),
    { header: 'Đơn vị tính', subHeader: 'itemUnit', field: 'unit' },
    { header: 'Số lượng (*)', subHeader: 'itemQuantity', field: 'quantity' },
    {
      header: 'Đơn giá (*)',
      subHeader: 'itemPrice',
      field: 'unitPriceBeforeTax',
    },
    {
      header: 'Thành tiền (*)',
      subHeader: 'amountBeforeTax',
      field: 'amountBeforeTax',
    },
    {
      header: 'Thuế GTGT (%) (*)',
      subHeader: 'taxPercentage',
      field: 'vatRate',
      format: 'viettel',
    },
    { header: 'Tiền thuế', subHeader: 'taxAmount', field: 'tax' },
    // Invoice note: carries the app code so the shop can match invoices back.
    { header: 'Ghi chú', subHeader: 'invoiceNote', field: 'appCode' },
  ],
};
