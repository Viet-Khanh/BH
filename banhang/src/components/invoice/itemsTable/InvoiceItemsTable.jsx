import { useState } from 'react';
import { useEditionFeature } from '../../../editions/useEdition.js';
import { confirmRemoveItem } from './confirmRemoveItem.js';
import InvoiceItemRow from './InvoiceItemRow.jsx';
import { buildItemColumns } from './itemColumns.js';

// Shared by sales and purchases. showDimensions defaults to the edition flag.
const InvoiceItemsTable = ({
  items,
  products,
  onUpdateItem,
  onRemoveItem,
  showDimensions,
  priceField = 'unitPrice',
  priceLabel = 'Đơn giá',
  qtyLabel = 'SL',
  totalQtyLabel = 'Tổng Sl/m2',
  showTotalQty = true,
  priceMin = 0,
  readOnly = false,
}) => {
  const editionDimensions = useEditionFeature('dimensions');
  const [editingCell, setEditingCell] = useState(null);
  const columns = buildItemColumns({
    showDimensions: showDimensions ?? editionDimensions,
    showTotalQty,
    qtyLabel,
    totalQtyLabel,
    priceLabel,
  });
  const editing = {
    readOnly,
    editingCell,
    setEditingCell,
    onUpdate: onUpdateItem,
  };

  return (
    <div className="pos-table invoice-edit-table">
      <table>
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column.key}>{column.title}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {items.map((item, index) => {
            const product = products.find((p) => p.id === item.productId);
            const onRemove = () =>
              confirmRemoveItem({
                productName: product?.name,
                onConfirm: () => onRemoveItem(index),
              });
            return (
              <InvoiceItemRow
                key={`${item.productId}-${index}`}
                columns={columns}
                item={item}
                index={index}
                product={product}
                priceField={priceField}
                priceMin={priceMin}
                editing={editing}
                onRemove={onRemove}
              />
            );
          })}
          {!items.length && (
            <tr>
              <td colSpan={columns.length} style={{ textAlign: 'center' }}>
                Chưa có hàng hóa. Dùng ô tìm kiếm để thêm nhanh.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default InvoiceItemsTable;
