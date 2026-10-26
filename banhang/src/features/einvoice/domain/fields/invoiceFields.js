import { DATE_FORMATS, money, PAYMENT_FORMATS } from './formats.js';

// Fields with one value per invoice (repeated on its lines unless the column
// is "first line only"). value(ctx, format): ctx = { doc, line, lineIndex, seq }.
export const INVOICE_FIELDS = [
  {
    key: 'invoiceSeq',
    label: 'STT hoá đơn trong file (1, 2, 3…)',
    value: ({ seq }) => seq,
  },
  {
    key: 'appCode',
    label: 'Mã hoá đơn trong app',
    value: ({ doc }) => doc.code,
  },
  {
    key: 'date',
    label: 'Ngày hoá đơn',
    formats: DATE_FORMATS,
    value: ({ doc }, format) => format(doc.date),
  },
  {
    key: 'buyerName',
    label: 'Người mua hàng',
    value: ({ doc }) => doc.buyer.name,
  },
  {
    key: 'companyName',
    label: 'Tên đơn vị mua',
    value: ({ doc }) => doc.buyer.companyName,
  },
  {
    key: 'buyerDisplayName',
    label: 'Tên khách (đơn vị, nếu không có thì người mua)',
    value: ({ doc }) => doc.buyer.companyName || doc.buyer.name,
  },
  {
    key: 'buyerTaxCode',
    label: 'MST người mua',
    value: ({ doc }) => doc.buyer.taxCode,
  },
  {
    key: 'buyerAddress',
    label: 'Địa chỉ người mua',
    value: ({ doc }) => doc.buyer.address,
  },
  {
    key: 'buyerEmail',
    label: 'Email người mua',
    value: ({ doc }) => doc.buyer.email,
  },
  {
    key: 'buyerPhone',
    label: 'Điện thoại người mua',
    value: ({ doc }) => doc.buyer.phone,
  },
  {
    key: 'paymentMethod',
    label: 'Hình thức thanh toán',
    formats: PAYMENT_FORMATS,
    value: ({ doc }, format) => format(doc.paymentMethod),
  },
  {
    key: 'discount',
    label: 'Chiết khấu hoá đơn (ghi ở dòng đầu)',
    value: ({ doc, lineIndex }) =>
      lineIndex === 0 && doc.discount ? money(doc.discount) : '',
  },
  {
    key: 'invoiceBeforeTax',
    label: 'Tổng tiền trước thuế',
    value: ({ doc }) => money(doc.totals.beforeTax),
  },
  {
    key: 'invoiceTax',
    label: 'Tổng tiền thuế',
    value: ({ doc }) => money(doc.totals.tax),
  },
  {
    key: 'invoiceTotal',
    label: 'Tổng thanh toán',
    value: ({ doc }) => money(doc.totals.total),
  },
  {
    key: 'sellerLocationCode',
    label: 'Mã địa điểm kinh doanh',
    value: ({ doc }) => doc.seller.locationCode,
  },
];
