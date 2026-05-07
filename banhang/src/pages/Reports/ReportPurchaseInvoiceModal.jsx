import { Button, Modal } from 'antd';
import { formatMoney } from '../../utils/moneyFormat.js';
import {
  formatReportDimension,
  formatReportMeasure,
  getReportTotalMeasure,
} from './reportItemMeasure.js';

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
}) => (
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
          style={{ display: 'flex', justifyContent: 'space-between', gap: 16 }}
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
                <th>Dài</th>
                <th>Rộng</th>
                <th>Số lượng</th>
                <th>SL/m2</th>
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
                  <td>{formatReportDimension(item.length)}</td>
                  <td>{formatReportDimension(item.width)}</td>
                  <td>{formatReportMeasure(item.qty)}</td>
                  <td>{formatReportMeasure(getReportTotalMeasure(item))}</td>
                  <td>{formatMoney(item.unitCost)}</td>
                  <td>{formatMoney(item.lineTotal)}</td>
                  <td>{item.note}</td>
                </tr>
              ))}
              {!items.length && (
                <tr>
                  <td colSpan={9} style={{ textAlign: 'center' }}>
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

export default ReportPurchaseInvoiceModal;
