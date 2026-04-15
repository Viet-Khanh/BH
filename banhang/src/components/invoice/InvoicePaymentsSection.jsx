import dayjs from 'dayjs';
import { formatMoney } from '../../utils/moneyFormat.js';

const InvoicePaymentsSection = ({
  isEdit,
  payments = [],
  changeLog = [],
  title = 'Thanh toán',
  emptyText = 'Chưa có lần thu tiền.',
  changeLogTitle = 'Lịch sử thay đổi',
}) => {
  if (!isEdit) return null;

  return (
    <div
      style={{
        padding: 16,
        border: '1.5px solid #e1eeec',
        margin: 16,
        borderRadius: 12,
      }}
    >
      <div>
        <div className="section-title">{title}</div>
        <div className="table-wrapper">
          <table className="invoice-items-table">
            <thead>
              <tr>
                <th>Ngày</th>
                <th>Phương thức</th>
                <th>Số tiền</th>
                <th>Ghi chú</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((payment) => (
                <tr key={payment.id}>
                  <td>{dayjs(payment.date).format('DD/MM/YYYY')}</td>
                  <td>{payment.method}</td>
                  <td>{formatMoney(payment.amount)}</td>
                  <td>{payment.note}</td>
                </tr>
              ))}
              {!payments.length && (
                <tr>
                  <td colSpan={4}>{emptyText}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {changeLog.length ? (
        <div>
          <div className="section-title">{changeLogTitle}</div>
          <div className="table-wrapper">
            <table className="invoice-items-table">
              <thead>
                <tr>
                  <th>Thời gian</th>
                  <th>Nội dung</th>
                </tr>
              </thead>
              <tbody>
                {changeLog.map((log, index) => (
                  <tr key={`${log.date}-${index}`}>
                    <td>{dayjs(log.date).format('DD/MM/YYYY HH:mm')}</td>
                    <td>{log.note}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default InvoicePaymentsSection;
