import { Button, Input, InputNumber } from 'antd';
import { formatMoney } from '../../utils/moneyFormat.js';
import { formatNumberInput, parseNumberInput } from '../../utils/numberInput.js';

const InvoiceItemsTable = ({
  items,
  products,
  onUpdateItem,
  onRemoveItem,
  showDimensions = true,
  priceField = 'unitPrice',
  priceLabel = 'Đơn giá',
  qtyLabel = 'SL/m2',
  readOnly = false,
}) => (
  <div className="pos-table">
    <table>
      <thead>
        <tr>
          <th>STT</th>
          <th>Tên hàng</th>
          <th>ĐVT</th>
          {showDimensions && <th>Dài</th>}
          {showDimensions && <th>Rộng</th>}
          <th>{qtyLabel}</th>
          <th>{priceLabel}</th>
          <th>Thành tiền</th>
          <th>Ghi chú</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        {items.map((item, index) => {
          const product = products.find((p) => p.id === item.productId);
          return (
            <tr key={`${item.productId}-${index}`}>
              <td>{index + 1}</td>
              <td>
                <div><strong>{product?.name || 'Sản phẩm'}</strong></div>
                <div>{product?.code || ''}</div>
              </td>
              <td>{product?.unit || ''}</td>
              {showDimensions && (
                <td>
                  <InputNumber
                    min={0}
                    value={item.length ?? undefined}
                    onChange={(value) => onUpdateItem(index, 'length', value)}
                    disabled={readOnly}
                  />
                </td>
              )}
              {showDimensions && (
                <td>
                  <InputNumber
                    min={0}
                    value={item.width ?? undefined}
                    onChange={(value) => onUpdateItem(index, 'width', value)}
                    disabled={readOnly}
                  />
                </td>
              )}
              <td>
                <InputNumber
                  value={item.qty}
                  onChange={(value) => onUpdateItem(index, 'qty', value)}
                  disabled={readOnly}
                />
              </td>
              <td>
                <InputNumber
                  min={0}
                  value={item[priceField]}
                  formatter={formatNumberInput}
                  parser={parseNumberInput}
                  onChange={(value) => onUpdateItem(index, priceField, value)}
                  disabled={readOnly}
                />
              </td>
              <td>{formatMoney(item.lineTotal)}</td>
              <td>
                <Input
                  value={item.lineNote}
                  onChange={(event) => onUpdateItem(index, 'lineNote', event.target.value)}
                  disabled={readOnly}
                />
              </td>
              <td>
                {!readOnly && (
                  <Button danger size="small" onClick={() => onRemoveItem(index)}>
                    Xóa
                  </Button>
                )}
              </td>
            </tr>
          );
        })}
        {!items.length && (
          <tr>
            <td colSpan={showDimensions ? 10 : 8} style={{ textAlign: 'center' }}>
              Chưa có hàng hóa. Dùng ô tìm kiếm để thêm nhanh.
            </td>
          </tr>
        )}
      </tbody>
    </table>
  </div>
);

export default InvoiceItemsTable;
