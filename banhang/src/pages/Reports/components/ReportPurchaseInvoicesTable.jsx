import dayjs from 'dayjs';
import { getPurchaseAmounts } from '../reportPurchaseUtils.js';
import { formatMoney } from '../../../utils/moneyFormat.js';

const ReportPurchaseInvoicesTable = ({
  rows,
  supplierMap,
  onSelectPurchase,
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
          <th>Nhà cung cấp</th>
          <th>Điện thoại</th>
          <th>Địa chỉ</th>
          <th>Ghi chú</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => {
          const { amount, paid, oldDebt, totalPay, remain } =
            getPurchaseAmounts(row);
          return (
            <tr
              key={row.id}
              onClick={() => onSelectPurchase(row.id)}
              style={{ cursor: 'pointer' }}
            >
              <td>{row.code}</td>
              <td>
                {row.date ? dayjs(row.date).format('DD/MM/YY HH:mm') : ''}
              </td>
              <td>{row.staff || ''}</td>
              <td>{row.itemsCount ?? ''}</td>
              <td>{row.qtySum ?? ''}</td>
              <td>{formatMoney(amount)}</td>
              <td className={paid > 0 ? 'text-success' : ''}>
                {formatMoney(paid)}
              </td>
              <td className="text-danger">{formatMoney(oldDebt)}</td>
              <td>{formatMoney(totalPay)}</td>
              <td className={remain > 0 ? 'text-danger' : 'text-success'}>
                {formatMoney(remain)}
              </td>
              <td>
                {row.supplierName || supplierMap[row.supplierId]?.name || ''}
              </td>
              <td>{row.phone || ''}</td>
              <td>{row.address || ''}</td>
              <td>{row.note}</td>
            </tr>
          );
        })}
        {!rows.length ? (
          <tr>
            <td colSpan={14} style={{ textAlign: 'center' }}>
              Chưa có hóa đơn nhập hàng.
            </td>
          </tr>
        ) : null}
      </tbody>
    </table>
  </div>
);

export default ReportPurchaseInvoicesTable;
