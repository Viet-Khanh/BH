import { useEffect, useMemo, useState } from 'react';
import dayjs from 'dayjs';
import { message } from 'antd';
import DateRangeFilter from '../../components/DateRangeFilter.jsx';
import ExportActions from '../../components/ExportActions.jsx';
import { getProfitReport } from '../../features/reports/api/reportsApi.js';
import { buildRollingDaysRange } from '../../features/reports/domain/reportFilters.js';
import { useReportFilters } from '../../features/reports/hooks/useReportFilters.js';
import { formatMoney } from '../../utils/moneyFormat.js';

const ReportProfitTab = () => {
  const defaultRange = useMemo(() => buildRollingDaysRange(), []);
  const { range, setRange } = useReportFilters({
    defaultRange,
    syncPagination: false,
  });
  const [rows, setRows] = useState([]);
  const [summary, setSummary] = useState({
    revenue: 0,
    cost: 0,
    profit: 0,
    cashIn: 0,
    cashOut: 0,
  });

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const data = await getProfitReport({ range });
        if (!active) return;
        setRows(data?.rows || []);
        setSummary({
          revenue: data?.summary?.revenue || 0,
          cost: data?.summary?.cost || 0,
          profit: data?.summary?.profit || 0,
          cashIn: data?.summary?.cashIn || 0,
          cashOut: data?.summary?.cashOut || 0,
        });
      } catch (error) {
        if (active) {
          message.error(
            `Không thể tải doanh thu: ${error.message || 'Lỗi không xác định'}`
          );
        }
      }
    };
    load();
    return () => {
      active = false;
    };
  }, [range]);

  const profitExport = useMemo(
    () =>
      rows.map((row) => ({
        Ngày: dayjs(row.date).format('DD/MM/YYYY'),
        'Doanh thu': row.revenue,
        'Giá vốn': row.cost,
        Lãi: row.profit,
      })),
    [rows]
  );

  return (
    <div>
      <div className="action-row">
        <DateRangeFilter value={range} onChange={setRange} />
        <div style={{ marginLeft: 'auto' }}>
          <ExportActions
            rows={profitExport}
            fileName="doanh-thu"
            sheetName="DoanhThu"
            title="Doanh thu"
          />
        </div>
      </div>
      <div className="section-title">Tổng hợp</div>
      <div className="invoice-summary">
        <span>
          Doanh thu:{' '}
          <span className="text-success">{formatMoney(summary.revenue)}</span>
        </span>
        <span>
          Giá vốn:{' '}
          <span className="text-danger">{formatMoney(summary.cost)}</span>
        </span>
        <span>
          Lãi:{' '}
          <span
            className={summary.profit >= 0 ? 'text-success' : 'text-danger'}
          >
            {formatMoney(summary.profit)}
          </span>
        </span>
        <span>
          Thu/Chi:{' '}
          <span className="text-success">{formatMoney(summary.cashIn)}</span> /{' '}
          <span className="text-danger">{formatMoney(summary.cashOut)}</span>
        </span>
      </div>
      <div className="section-title">Theo ngày</div>
      <div className="table-wrapper">
        <table className="invoice-items-table">
          <thead>
            <tr>
              <th>Ngày</th>
              <th>Doanh thu</th>
              <th>Giá vốn</th>
              <th>Lãi</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.date}>
                <td>{dayjs(row.date).format('DD/MM/YYYY')}</td>
                <td className="text-success">{formatMoney(row.revenue)}</td>
                <td className="text-danger">{formatMoney(row.cost)}</td>
                <td
                  className={row.profit >= 0 ? 'text-success' : 'text-danger'}
                >
                  {formatMoney(row.profit)}
                </td>
              </tr>
            ))}
            {!rows.length && (
              <tr>
                <td colSpan={4}>Chưa có dữ liệu.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ReportProfitTab;
