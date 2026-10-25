// Ordered columns of the invoice/purchase items table. Pure data: header titles
// and the cell renderer key used by InvoiceItemRow.
export const buildItemColumns = ({
  showDimensions,
  showTotalQty,
  qtyLabel,
  totalQtyLabel,
  priceLabel,
}) => [
  { key: 'index', title: 'STT' },
  { key: 'name', title: 'Tên hàng' },
  { key: 'unit', title: 'ĐVT' },
  ...(showDimensions
    ? [
        { key: 'length', title: 'Dài' },
        { key: 'width', title: 'Rộng' },
      ]
    : []),
  { key: 'qty', title: qtyLabel },
  ...(showDimensions && showTotalQty
    ? [{ key: 'measuredQty', title: totalQtyLabel }]
    : []),
  { key: 'price', title: priceLabel },
  { key: 'lineTotal', title: 'Thành tiền' },
  { key: 'note', title: 'Ghi chú' },
  { key: 'actions', title: '' },
];
