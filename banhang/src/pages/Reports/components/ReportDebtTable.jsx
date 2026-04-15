import { Button, Input } from 'antd';
import ExportActions from '../../../components/ExportActions.jsx';
import { formatMoney } from '../../../utils/moneyFormat.js';

const ReportDebtTable = ({
  keyword,
  onKeywordChange,
  exportRows,
  summaryItems,
  rows,
  onView,
}) => (
  <>
    <div className="action-row">
      <Input
        allowClear
        size="large"
        placeholder="Tìm theo khách hàng"
        value={keyword}
        onChange={(event) => onKeywordChange(event.target.value)}
        style={{ maxWidth: 360 }}
      />
      <div style={{ marginLeft: 'auto' }}>
        <ExportActions
          rows={exportRows}
          fileName="cong-no"
          sheetName="CongNo"
          title="Công nợ"
          summaryItems={summaryItems}
        />
      </div>
    </div>

    <div className="table-wrapper">
      <table className="invoice-items-table">
        <thead>
          <tr>
            <th>Khách hàng</th>
            <th>Tổng bán</th>
            <th>Đã thu</th>
            <th>Còn nợ</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.customer?.id || row.customer?.name}>
              <td>{row.customer?.name}</td>
              <td>{formatMoney(row.total)}</td>
              <td>{formatMoney(row.paid)}</td>
              <td>{formatMoney(row.debt)}</td>
              <td>
                <Button onClick={() => onView(row)}>Xem</Button>
              </td>
            </tr>
          ))}
          {!rows.length ? (
            <tr>
              <td colSpan={5}>Chưa có dữ liệu.</td>
            </tr>
          ) : null}
        </tbody>
      </table>
    </div>
  </>
);

export default ReportDebtTable;
