import { Button, Modal } from "antd";
import { formatMoney } from "../../utils/moneyFormat.js";

const ReportSalesInvoiceModal = ({
  open,
  invoice,
  customer,
  items,
  onClose,
  onDelete,
  onEdit,
  onPrint,
  onExport,
}) => (
  <Modal
    title="PHIẾU BÁN HÀNG"
    open={open}
    onCancel={onClose}
    footer={null}
    width={900}
  >
    {invoice && (
      <div>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 16 }}>
          <div>
            HĐ: <strong>{invoice.code}</strong>
          </div>
          <div>
            KH: <strong>{customer?.name || "Khách lẻ"}</strong>
          </div>
          <div>
            Tổng tiền: <strong>{formatMoney(invoice.total || 0)}</strong>
          </div>
        </div>
        <div className="pos-table" style={{ marginTop: 12 }}>
          <table>
            <thead>
              <tr>
                <th>Tên hàng</th>
                <th>ĐVT</th>
                <th>Quy cách</th>
                <th>T.SL</th>
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
                  <td>{item.spec}</td>
                  <td>{item.qty}</td>
                  <td>{formatMoney(item.unitPrice)}</td>
                  <td>{formatMoney(item.lineTotal)}</td>
                  <td>{item.note}</td>
                </tr>
              ))}
              {!items.length && (
                <tr>
                  <td colSpan={7} style={{ textAlign: "center" }}>
                    Chưa có hàng hóa.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
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
          <Button size="large" type="primary" className="btn-primary" onClick={onPrint}>
            IN LẠI
          </Button>
          <Button size="large" onClick={onExport}>
            Xuất File...
          </Button>
          <Button size="large" onClick={onClose}>
            THOÁT
          </Button>
        </div>
        <div style={{ marginTop: 12, color: "#b91c1c", fontSize: 12 }}>
          * Chức năng SỬA, XÓA hóa đơn chỉ dành cho Khách lẻ, nếu khách có công nợ, chỉ áp dụng cho hóa đơn gần đây nhất.
        </div>
      </div>
    )}
  </Modal>
);

export default ReportSalesInvoiceModal;
