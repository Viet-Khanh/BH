import { Button, Modal } from 'antd';
import { formatMoney } from '../../utils/moneyFormat.js';
import {
  DimensionCells,
  DimensionHeaders,
  MeasuredQtyCell,
  MeasuredQtyHeader,
  useMeasureColumnCount,
} from '../../components/measure/MeasureCells.jsx';
import { formatMeasure } from '../../utils/measureFormat.js';

const ReportPurchaseInvoiceModal = ({
  open,
  purchase,
  supplier,
  items,
  onClose,
  onDelete,
  onEdit,
  onPrint,
  onExport,
}) => {
  const measureCount = useMeasureColumnCount({ measuredQty: true });
  return (
    <Modal
      title="PHIẾU NHẬP HÀNG"
      open={open}
      onCancel={onClose}
      footer={null}
      width={1100}
    >
      {purchase && (
        <div>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              gap: 16,
            }}
          >
            <div>
              Phiếu: <strong>{purchase.code}</strong>
            </div>
            <div>
              NCC: <strong>{supplier?.name || ''}</strong>
            </div>
            <div>
              Tổng tiền: <strong>{formatMoney(purchase.total || 0)}</strong>
            </div>
          </div>
          <div className="pos-table" style={{ marginTop: 12 }}>
            <table className="report-invoice-items-table">
              <thead>
                <tr>
                  <th>Tên hàng</th>
                  <th>ĐVT</th>
                  <DimensionHeaders />
                  <th>Số lượng</th>
                  <MeasuredQtyHeader />
                  <th>Đơn giá</th>
                  <th>Thành tiền</th>
                  <th>Ghi chú</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.key}>
                    <td>{item.name}</td>
                    <td>{item.unit}</td>
                    <DimensionCells item={item} />
                    <td>{formatMeasure(item.qty)}</td>
                    <MeasuredQtyCell item={item} />
                    <td>{formatMoney(item.unitCost)}</td>
                    <td>{formatMoney(item.lineTotal)}</td>
                    <td>{item.note}</td>
                  </tr>
                ))}
                {!items.length && (
                  <tr>
                    <td
                      colSpan={6 + measureCount}
                      style={{ textAlign: 'center' }}
                    >
                      Chưa có hàng hóa.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginTop: 16,
              gap: 12,
            }}
          >
            <Button danger size="large" onClick={onDelete}>
              XÓA
            </Button>
            <Button size="large" onClick={onEdit}>
              SỬA
            </Button>
            <Button
              size="large"
              type="primary"
              className="btn-primary"
              onClick={onPrint}
            >
              IN LẠI
            </Button>
            <Button size="large" onClick={onExport}>
              Xuất File...
            </Button>
            <Button size="large" onClick={onClose}>
              THOÁT
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
};

export default ReportPurchaseInvoiceModal;
