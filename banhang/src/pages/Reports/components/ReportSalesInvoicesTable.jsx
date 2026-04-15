import dayjs from 'dayjs';
import { formatMoney } from '../../../utils/moneyFormat.js';

const ReportSalesInvoicesTable = ({
  rows,
  showSensitiveInfo = false,
  debtTimelineLoading = false,
  onSelectInvoice,
}) => (
  <div className="pos-table">
    <table>
      <thead>
        <tr>
          <th>Số HĐ</th>
          <th>Ngày</th>
          <th>Nhân viên</th>
          <th>MH</th>
          <th>SL</th>
          <th>Tiền hàng</th>
          <th>Đã thu</th>
          <th>Nợ cũ</th>
          <th>Tổng cộng</th>
          <th>Còn nợ</th>
          {showSensitiveInfo ? <th>Lợi nhuận</th> : null}
          <th>Khách hàng</th>
          <th>Điện thoại</th>
          <th>Địa chỉ</th>
          <th>Ghi chú</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => {
          const isInvoiceRow = row.rowType === 'invoice';
          return (
            <tr
              key={row.id}
              onClick={isInvoiceRow ? () => onSelectInvoice(row.id) : undefined}
              style={{
                cursor: isInvoiceRow ? 'pointer' : 'default',
                background: isInvoiceRow ? undefined : '#fffbe6',
              }}
            >
              <td>{isInvoiceRow ? row.code : ''}</td>
              <td>{dayjs(row.date).format('DD/MM/YY HH:mm')}</td>
              <td>{isInvoiceRow ? row.staff : ''}</td>
              <td>{isInvoiceRow ? row.itemsCount : ''}</td>
              <td>{isInvoiceRow ? row.qtySum : ''}</td>
              <td>{isInvoiceRow ? formatMoney(row.amount) : ''}</td>
              <td className={row.paid > 0 ? 'text-success' : ''}>
                {formatMoney(row.paid)}
              </td>
              <td className="text-danger">{formatMoney(row.oldDebt)}</td>
              <td>{isInvoiceRow ? formatMoney(row.totalPay) : ''}</td>
              <td className={row.remain > 0 ? 'text-danger' : 'text-success'}>
                {formatMoney(row.remain)}
              </td>
              {showSensitiveInfo ? (
                <td
                  className={
                    !isInvoiceRow
                      ? ''
                      : row.profit >= 0
                        ? 'text-success'
                        : 'text-danger'
                  }
                >
                  {isInvoiceRow ? formatMoney(row.profit) : ''}
                </td>
              ) : null}
              <td>{isInvoiceRow ? row.customerName : ''}</td>
              <td>{isInvoiceRow ? row.phone : ''}</td>
              <td>{isInvoiceRow ? row.address : ''}</td>
              <td>{isInvoiceRow ? row.note : ''}</td>
            </tr>
          );
        })}
        {!rows.length ? (
          <tr>
            <td
              colSpan={showSensitiveInfo ? 15 : 14}
              style={{ textAlign: 'center' }}
            >
              {debtTimelineLoading ? 'Đang tải dữ liệu...' : 'Chưa có hóa đơn.'}
            </td>
          </tr>
        ) : null}
      </tbody>
    </table>
  </div>
);

export default ReportSalesInvoicesTable;
