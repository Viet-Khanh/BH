import { Tag, Tooltip } from 'antd';
import {
  buildStockTotalsByUnit,
  formatStockArea,
  formatStockNumber,
} from '../reportStockMovementUtils.js';
import StockMovementHeader from './StockMovementHeader.jsx';

const MIXED_UNIT_HINT =
  'Sản phẩm có cả dòng nhập/bán theo kích thước (dài × rộng) và dòng không kích thước, nên SL có thể không cùng nghĩa.';
const NEGATIVE_HINT =
  'Xuất nhiều hơn tồn. Kiểm tra phiếu nhập hoặc kiểm kho lại.';

const ClosingCell = ({ value }) =>
  value < 0 ? (
    <td className="text-danger" title={NEGATIVE_HINT}>
      {formatStockNumber(value)}
    </td>
  ) : (
    <td>{formatStockNumber(value)}</td>
  );

const StockMovementRow = ({ row, onSelect }) => (
  <tr
    style={{ cursor: 'pointer' }}
    title="Bấm để xem thẻ kho"
    onClick={() => onSelect(row)}
  >
    <td>
      {row.name}
      {row.mixedUnit ? (
        <Tooltip title={MIXED_UNIT_HINT}>
          <Tag color="orange" style={{ marginLeft: 8 }}>
            Lẫn đơn vị
          </Tag>
        </Tooltip>
      ) : null}
    </td>
    <td>{row.unit}</td>
    <td>{formatStockNumber(row.openingStock)}</td>
    <td>{formatStockNumber(row.inQty)}</td>
    <td>{formatStockArea(row.inArea)}</td>
    <td>{formatStockNumber(row.outQty)}</td>
    <td>{formatStockArea(row.outArea)}</td>
    <ClosingCell value={row.closingStock} />
  </tr>
);

const StockMovementTotals = ({ rows }) => (
  <tfoot>
    {buildStockTotalsByUnit(rows).map((total) => (
      <tr key={total.unit} style={{ fontWeight: 600 }}>
        <td>Tổng</td>
        <td>{total.unit}</td>
        <td>{formatStockNumber(total.openingStock)}</td>
        <td>{formatStockNumber(total.inQty)}</td>
        <td>{formatStockArea(total.inArea)}</td>
        <td>{formatStockNumber(total.outQty)}</td>
        <td>{formatStockArea(total.outArea)}</td>
        <ClosingCell value={total.closingStock} />
      </tr>
    ))}
  </tfoot>
);

const StockMovementTable = ({ rows, labels, onSelect }) => (
  <div className="table-wrapper">
    <table className="invoice-items-table">
      <StockMovementHeader labels={labels} />
      <tbody>
        {rows.map((row) => (
          <StockMovementRow key={row.id} row={row} onSelect={onSelect} />
        ))}
        {!rows.length && (
          <tr>
            <td colSpan={8}>Chưa có dữ liệu.</td>
          </tr>
        )}
      </tbody>
      {rows.length ? <StockMovementTotals rows={rows} /> : null}
    </table>
  </div>
);

export default StockMovementTable;
