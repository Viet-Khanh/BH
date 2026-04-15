import { useCallback, useEffect, useMemo, useState } from 'react';
import { Input, message } from 'antd';
import DateRangeFilter from '../../components/DateRangeFilter.jsx';
import ExportActions from '../../components/ExportActions.jsx';
import { getStockMovementReport } from '../../features/reports/api/reportsApi.js';
import { buildMonthToDateRange } from '../../features/reports/domain/reportFilters.js';
import { useReportFilters } from '../../features/reports/hooks/useReportFilters.js';

const buildExportRow = (row) => ({
  'Tên hàng': row.name,
  ĐVT: row.unit,
  'Tồn đầu': row.openingStock,
  Nhập: row.inQty,
  Xuất: row.outQty,
  'Tồn cuối': row.closingStock,
});

const ReportStockMovementTab = () => {
  const defaultRange = useMemo(() => buildMonthToDateRange(), []);
  const { range, setRange } = useReportFilters({
    defaultRange,
    syncPagination: false,
  });
  const [keyword, setKeyword] = useState('');
  const [rows, setRows] = useState([]);

  const fetchReport = useCallback(async () => {
    const data = await getStockMovementReport({ range });
    setRows(Array.isArray(data?.rows) ? data.rows : []);
  }, [range]);

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        await fetchReport();
      } catch (error) {
        if (active) {
          message.error(
            `Không thể tải nhập xuất tồn kho: ${error.message || 'Lỗi không xác định'}`
          );
        }
      }
    };
    load();
    return () => {
      active = false;
    };
  }, [fetchReport]);

  const filteredRows = useMemo(() => {
    const normalized = keyword.trim().toLowerCase();
    if (!normalized) return rows;
    return rows.filter((row) =>
      String(row.name || '')
        .toLowerCase()
        .includes(normalized)
    );
  }, [rows, keyword]);

  const exportRows = useMemo(
    () => filteredRows.map(buildExportRow),
    [filteredRows]
  );

  return (
    <div>
      <div className="action-row">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <span style={{ fontWeight: 600 }}>Theo ngày</span>
          <DateRangeFilter value={range} onChange={setRange} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <span style={{ fontWeight: 600 }}>Sản phẩm</span>
          <Input
            size="large"
            placeholder="Tìm theo sản phẩm"
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
            style={{ minWidth: 220 }}
          />
        </div>
        <div style={{ display: 'flex', alignItems: 'end', marginLeft: 'auto' }}>
          <ExportActions
            rows={exportRows}
            pdfRows={exportRows}
            fileName="nhap-xuat-ton"
            sheetName="NhapXuatTon"
            title="Nhập xuất tồn kho"
          />
        </div>
      </div>

      <div className="table-wrapper">
        <table className="invoice-items-table">
          <thead>
            <tr>
              <th>Tên hàng</th>
              <th>ĐVT</th>
              <th>Tồn đầu</th>
              <th>Nhập</th>
              <th>Xuất</th>
              <th>Tồn cuối</th>
            </tr>
          </thead>
          <tbody>
            {filteredRows.map((row) => (
              <tr key={row.id}>
                <td>{row.name}</td>
                <td>{row.unit}</td>
                <td>{row.openingStock}</td>
                <td>{row.inQty}</td>
                <td>{row.outQty}</td>
                <td>{row.closingStock}</td>
              </tr>
            ))}
            {!filteredRows.length && (
              <tr>
                <td colSpan={6}>Chưa có dữ liệu.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ReportStockMovementTab;
