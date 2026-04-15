import { Modal } from 'antd';
import dayjs from 'dayjs';
import { formatMoney } from '../../../utils/moneyFormat.js';

const SupplierDebtDetailModal = ({ debtDetail, onClose }) => (
  <Modal
    title="Chi tiết công nợ nhà cung cấp"
    open={!!debtDetail}
    onCancel={onClose}
    footer={null}
  >
    {debtDetail ? (
      <div>
        <div className="section-title">{debtDetail.supplier?.name}</div>
        <div style={{ marginBottom: 12 }}>
          <div>
            Tổng nhập:{' '}
            <strong>
              {formatMoney(debtDetail.summary?.purchaseTotal || 0)}
            </strong>
          </div>
          <div>
            Trả theo phiếu nhập:{' '}
            <strong>
              {formatMoney(debtDetail.summary?.purchasePaid || 0)}
            </strong>
          </div>
          <div>
            Trả nợ độc lập:{' '}
            <strong>{formatMoney(debtDetail.summary?.debtPaid || 0)}</strong>
          </div>
          <div>
            Còn nợ:{' '}
            <strong>{formatMoney(debtDetail.summary?.debt || 0)}</strong>
          </div>
        </div>

        <div className="table-wrapper">
          <table className="invoice-items-table">
            <thead>
              <tr>
                <th>Mã phiếu</th>
                <th>Ngày</th>
                <th>Tổng</th>
                <th>Còn nợ</th>
              </tr>
            </thead>
            <tbody>
              {debtDetail.purchases?.map((purchase) => (
                <tr key={purchase.id}>
                  <td>{purchase.code}</td>
                  <td>{dayjs(purchase.date).format('DD/MM/YYYY')}</td>
                  <td>{formatMoney(purchase.total)}</td>
                  <td>{formatMoney(purchase.remain)}</td>
                </tr>
              ))}
              {!debtDetail.purchases?.length ? (
                <tr>
                  <td colSpan={4}>Chưa có dữ liệu.</td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>

        <div className="section-title" style={{ marginTop: 16 }}>
          Phiếu trả nợ
        </div>
        <div className="table-wrapper">
          <table className="invoice-items-table">
            <thead>
              <tr>
                <th>Ngày</th>
                <th>Số tiền</th>
                <th>Phương thức</th>
                <th>Ghi chú</th>
              </tr>
            </thead>
            <tbody>
              {debtDetail.debtPayments?.map((payment) => (
                <tr key={payment.id}>
                  <td>{dayjs(payment.date).format('DD/MM/YYYY')}</td>
                  <td>{formatMoney(payment.amount)}</td>
                  <td>{payment.method}</td>
                  <td>{payment.note}</td>
                </tr>
              ))}
              {!debtDetail.debtPayments?.length ? (
                <tr>
                  <td colSpan={4}>Chưa có phiếu trả nợ.</td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>
    ) : null}
  </Modal>
);

export default SupplierDebtDetailModal;
