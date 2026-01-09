import { useMemo } from 'react';
import dayjs from 'dayjs';
import { useCashbookStore } from '../../store/cashbookStore.js';
import DateRangeFilter from '../../components/DateRangeFilter.jsx';
import { formatMoney } from '../../utils/moneyFormat.js';

const ReportCashTab = ({ range, onRangeChange }) => {
  const { items: cashbook } = useCashbookStore();

  const summary = useMemo(() => {
    const cashIn = cashbook.reduce((sum, entry) => {
      const inRange = range[0] && range[1]
        ? !dayjs(entry.date).isBefore(dayjs(range[0]).startOf('day')) &&
          !dayjs(entry.date).isAfter(dayjs(range[1]).endOf('day'))
        : true;
      if (!inRange || entry.type !== 'in') return sum;
      return sum + Number(entry.amount || 0);
    }, 0);

    const cashOut = cashbook.reduce((sum, entry) => {
      const inRange = range[0] && range[1]
        ? !dayjs(entry.date).isBefore(dayjs(range[0]).startOf('day')) &&
          !dayjs(entry.date).isAfter(dayjs(range[1]).endOf('day'))
        : true;
      if (!inRange || entry.type !== 'out') return sum;
      return sum + Number(entry.amount || 0);
    }, 0);

    return { cashIn, cashOut };
  }, [cashbook, range]);

  return (
    <div>
      <div className="action-row">
        <DateRangeFilter value={range} onChange={onRangeChange} />
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
