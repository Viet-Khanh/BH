import { useEffect, useMemo, useState } from 'react';
import dayjs from 'dayjs';
import { message } from 'antd';
import DateRangeFilter from '../../components/DateRangeFilter.jsx';
import ExportActions from '../../components/ExportActions.jsx';
import { apiRequest } from '../../db/repository.js';
import { formatMoney } from '../../utils/moneyFormat.js';

const ReportProfitTab = ({ range, onRangeChange }) => {
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
        const params = new URLSearchParams();
        if (range[0]) params.set('from', range[0]);
        if (range[1]) params.set('to', range[1]);
        const query = params.toString();
        const data = await apiRequest(`/reports/profit${query ? `?${query}` : ''}`);
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
          message.error(`Không thể tải doanh thu: ${error.message || 'Lỗi không xác định'}`);
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
        Ngay: dayjs(row.date).format('DD/MM/YYYY'),
        Doanh_thu: row.revenue,
        Gia_von: row.cost,
        Lai: row.profit,
      })),
    [rows]
  );

  return (
    <div>
      <div className="action-row">
        <DateRangeFilter value={range} onChange={onRangeChange} />
        <div style={{ marginLeft: 'auto' }}>
          <ExportActions rows={profitExport} fileName="doanh-thu" sheetName="DoanhThu" title="Doanh thu" />
        </div>
      </div>
      <div className="section-title">Tổng hợp</div>
      <div className="invoice-summary">
        <span>Doanh thu: {formatMoney(summary.revenue)}</span>
        <span>Giá vốn: {formatMoney(summary.cost)}</span>
        <span>Lãi: {formatMoney(summary.profit)}</span>
        <span>Thu/Chi: {formatMoney(summary.cashIn)} / {formatMoney(summary.cashOut)}</span>
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
                <td>{formatMoney(row.revenue)}</td>
                <td>{formatMoney(row.cost)}</td>
                <td>{formatMoney(row.profit)}</td>
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
