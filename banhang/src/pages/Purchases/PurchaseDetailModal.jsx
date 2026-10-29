import { Button, Modal } from 'antd';
import {
  DimensionCells,
  DimensionHeaders,
} from '../../components/measure/MeasureCells.jsx';
import { formatMoney } from '../../utils/moneyFormat.js';
import { getItemUnitName } from '../../utils/productUnits.js';

// `onPrintLabels(detail)` adds an "In tem" button (edition flag `labels`).
const PurchaseDetailModal = ({
  open,
  onClose,
  detail,
  products,
  onPrintLabels,
}) => (
  <Modal
    title="Chi tiết phiếu nhập"
    open={open}
    onCancel={onClose}
    footer={
      onPrintLabels && detail ? (
        <Button onClick={() => onPrintLabels(detail)}>In tem</Button>
      ) : null
    }
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
                <DimensionHeaders />
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
                    <td>{getItemUnitName(item, product)}</td>
                    <DimensionCells item={item} />
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
