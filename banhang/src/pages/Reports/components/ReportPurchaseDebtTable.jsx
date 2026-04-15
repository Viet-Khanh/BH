import { Button } from 'antd';
import ExportActions from '../../../components/ExportActions.jsx';
import { formatMoney } from '../../../utils/moneyFormat.js';

const ReportPurchaseDebtTable = ({ exportRows, rows, onView }) => (
  <>
    <div className="action-row">
      <ExportActions
        rows={exportRows}
        fileName="cong-no-nha-cung-cap"
        sheetName="CongNoNCC"
        title="Công nợ nhà cung cấp"
      />
    </div>

    <div className="table-wrapper">
      <table className="invoice-items-table">
        <thead>
          <tr>
            <th>Nhà cung cấp</th>
            <th>Tổng nhập</th>
            <th>Đã trả</th>
            <th>Còn nợ</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.supplier?.id || row.supplier?.name}>
              <td>{row.supplier?.name}</td>
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

export default ReportPurchaseDebtTable;
