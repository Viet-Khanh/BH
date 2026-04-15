import { useEffect, useMemo, useState } from 'react';
import { message } from 'antd';
import DateRangeFilter from '../../components/DateRangeFilter.jsx';
import ExportActions from '../../components/ExportActions.jsx';
import { getCashReport } from '../../features/reports/api/reportsApi.js';
import { buildRollingDaysRange } from '../../features/reports/domain/reportFilters.js';
import { useReportFilters } from '../../features/reports/hooks/useReportFilters.js';
import { formatMoney } from '../../utils/moneyFormat.js';

const ReportCashTab = () => {
  const defaultRange = useMemo(() => buildRollingDaysRange(), []);
  const { range, setRange } = useReportFilters({
    defaultRange,
    syncPagination: false,
  });
  const [summary, setSummary] = useState({ cashIn: 0, cashOut: 0 });

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const data = await getCashReport({ range });
        if (!active) return;
        setSummary({
          cashIn: data?.cashIn || 0,
          cashOut: data?.cashOut || 0,
        });
      } catch (error) {
        if (active) {
          message.error(
            `Không thể tải thu chi: ${error.message || 'Lỗi không xác định'}`
          );
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
        <DateRangeFilter value={range} onChange={setRange} />
        <div style={{ marginLeft: 'auto' }}>
          <ExportActions
            rows={cashExport}
            fileName="thu-chi"
            sheetName="ThuChi"
            title="Thu/Chi"
          />
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
