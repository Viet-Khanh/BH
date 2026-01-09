import { Button, Input, InputNumber } from 'antd';
import { formatMoney } from '../../utils/moneyFormat.js';

const PurchaseItemsTable = ({ items, products, onUpdateItem, onRemoveItem }) => (
  <div className="pos-table">
    <table>
      <thead>
        <tr>
          <th>STT</th>
          <th>Tên hàng</th>
          <th>ĐVT</th>
          <th>SL</th>
          <th>Đơn giá</th>
          <th>Thành tiền</th>
          <th>Ghi chú</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        {items.map((item, index) => {
          const product = products.find((p) => p.id === item.productId);
          return (
            <tr key={item.productId}>
              <td>{index + 1}</td>
              <td>
                <div><strong>{product?.name || '---'}</strong></div>
                <div>{product?.code || '---'} · {product?.unit || ''}</div>
              </td>
              <td>{product?.unit || ''}</td>
              <td>
                <InputNumber
                  min={0}
                  value={item.qty}
                  onChange={(value) => onUpdateItem(index, 'qty', value)}
                />
              </td>
              <td>
                <InputNumber
                  min={0}
                  value={item.unitCost}
                  onChange={(value) => onUpdateItem(index, 'unitCost', value)}
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
                <Button danger onClick={() => onRemoveItem(index)}>Xóa</Button>
              </td>
            </tr>
          );
        })}
        {!items.length && (
          <tr>
            <td colSpan={8} style={{ textAlign: 'center' }}>
              Chưa có hàng hóa. Dùng ô tìm kiếm để thêm nhanh.
            </td>
          </tr>
        )}
      </tbody>
    </table>
  </div>
);

export default PurchaseItemsTable;
