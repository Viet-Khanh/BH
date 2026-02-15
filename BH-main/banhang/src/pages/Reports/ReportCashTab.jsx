import { useEffect, useMemo, useState } from 'react';
import { message } from 'antd';
import DateRangeFilter from '../../components/DateRangeFilter.jsx';
import ExportActions from '../../components/ExportActions.jsx';
import { apiRequest } from '../../db/repository.js';
import { formatMoney } from '../../utils/moneyFormat.js';

const ReportCashTab = ({ range, onRangeChange }) => {
  const [summary, setSummary] = useState({ cashIn: 0, cashOut: 0 });

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const params = new URLSearchParams();
        if (range[0]) params.set('from', range[0]);
        if (range[1]) params.set('to', range[1]);
        const query = params.toString();
        const data = await apiRequest(`/reports/cash${query ? `?${query}` : ''}`);
        if (!active) return;
        setSummary({
          cashIn: data?.cashIn || 0,
          cashOut: data?.cashOut || 0,
        });
      } catch (error) {
        if (active) {
          message.error(`Không thể tải thu chi: ${error.message || 'Lỗi không xác định'}`);
        }
      }
    };
    load();
    return () => {
      active = false;
    };
  }, [range]);

  const cashExport = useMemo(
    () => [
      { Loai: 'Thu', So_tien: summary.cashIn },
      { Loai: 'Chi', So_tien: summary.cashOut },
      { Loai: 'Con_lai', So_tien: summary.cashIn - summary.cashOut },
    ],
    [summary]
  );

  return (
    <div>
      <div className="action-row">
        <DateRangeFilter value={range} onChange={onRangeChange} />
        <div style={{ marginLeft: 'auto' }}>
          <ExportActions rows={cashExport} fileName="thu-chi" sheetName="ThuChi" title="Thu/Chi" />
        </div>
      </div>
      <div className="invoice-summary">
        <span>Thu: {formatMoney(summary.cashIn)}</span>
        <span>Chi: {formatMoney(summary.cashOut)}</span>
        <span>Còn lại: {formatMoney(summary.cashIn - summary.cashOut)}</span>
      </div>
    </div>
  );
};

export default ReportCashTab;
