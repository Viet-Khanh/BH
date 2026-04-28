import { Modal } from 'antd';
import { formatMoney } from '../../utils/moneyFormat.js';

const PurchaseDetailModal = ({ open, onClose, detail, products }) => (
  <Modal
    title="Chi tiết phiếu nhập"
    open={open}
    onCancel={onClose}
    footer={null}
    width={900}
  >
    {detail && (
      <div>
        <div className="section-title">{detail.code}</div>
        <div className="table-wrapper">
          <table className="invoice-items-table">
            <thead>
              <tr>
                <th>Tên hàng</th>
                <th>ĐVT</th>
                <th>Dài</th>
                <th>Rộng</th>
                <th>SL</th>
                <th>Đơn giá</th>
                <th>Thành tiền</th>
                <th>Ghi chú</th>
              </tr>
            </thead>
            <tbody>
              {(detail.items || []).map((item, index) => {
                const product = products.find((p) => p.id === item.productId);
                return (
                  <tr key={`${item.productId}-${index}`}>
                    <td>{product?.name || ''}</td>
                    <td>{product?.unit || ''}</td>
                    <td>{item.length ?? ''}</td>
                    <td>{item.width ?? ''}</td>
                    <td>{item.qty}</td>
                    <td>{formatMoney(item.unitCost)}</td>
                    <td>{formatMoney(item.lineTotal)}</td>
                    <td>{item.lineNote}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    )}
  </Modal>
);

export default PurchaseDetailModal;
