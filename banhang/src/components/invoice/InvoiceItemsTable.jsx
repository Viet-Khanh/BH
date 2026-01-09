import { Button, Input, InputNumber } from 'antd';
import { formatMoney } from '../../utils/moneyFormat.js';
import { formatNumberInput, parseNumberInput } from '../../utils/numberInput.js';
import { isGlassProduct } from './invoiceUtils.js';

const InvoiceItemsTable = ({ items, products, onUpdateItem, onRemoveItem }) => (
  <div className="pos-table">
    <table>
      <thead>
        <tr>
          <th>STT</th>
          <th>Tên hàng</th>
          <th>ĐVT</th>
          <th>Dài</th>
          <th>Rộng</th>
          <th>SL/m2</th>
          <th>Đơn giá</th>
          <th>Thành tiền</th>
          <th>Ghi chú</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        {items.map((item, index) => {
          const product = products.find((p) => p.id === item.productId);
          const isGlass = isGlassProduct(product);
          return (
            <tr key={`${item.productId}-${index}`}>
              <td>{index + 1}</td>
              <td>
                <div><strong>{product?.name || 'Sản phẩm'}</strong></div>
                <div>{product?.code || ''}</div>
              </td>
              <td>{product?.unit || ''}</td>
              <td>
                {isGlass ? (
                  <InputNumber
                    min={0}
                    value={item.length ?? undefined}
                    onChange={(value) => onUpdateItem(index, 'length', value)}
                  />
                ) : (
                  '-'
                )}
              </td>
              <td>
                {isGlass ? (
                  <InputNumber
                    min={0}
                    value={item.width ?? undefined}
                    onChange={(value) => onUpdateItem(index, 'width', value)}
                  />
                ) : (
                  '-'
                )}
              </td>
              <td>
                <InputNumber
                  value={item.qty}
                  onChange={(value) => onUpdateItem(index, 'qty', value)}
                />
              </td>
              <td>
                <InputNumber
                  min={0}
                  value={item.unitPrice}
                  formatter={formatNumberInput}
                  parser={parseNumberInput}
                  onChange={(value) => onUpdateItem(index, 'unitPrice', value)}
                />
              </td>
              <td>{formatMoney(item.lineTotal)}</td>
              <td>
                <Input
                  value={item.lineNote}
                  onChange={(event) => onUpdateItem(index, 'lineNote', event.target.value)}
                />
              </td>
              <td>
                <Button danger size="small" onClick={() => onRemoveItem(index)}>
                  Xóa
                </Button>
              </td>
            </tr>
          );
        })}
        {!items.length && (
          <tr>
            <td colSpan={10} style={{ textAlign: 'center' }}>
              Chưa có hàng hóa. Dùng ô tìm kiếm để thêm nhanh.
            </td>
          </tr>
        )}
      </tbody>
    </table>
  </div>
);

export default InvoiceItemsTable;
