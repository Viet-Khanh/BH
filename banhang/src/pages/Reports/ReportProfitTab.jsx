import { useMemo } from 'react';
import dayjs from 'dayjs';
import { useInvoiceStore } from '../../store/invoiceStore.js';
import { useCashbookStore } from '../../store/cashbookStore.js';
import DateRangeFilter from '../../components/DateRangeFilter.jsx';
import ExportButton from '../../components/ExportButton.jsx';
import { computeProfitByDay } from '../../utils/computeProfitByDay.js';
import { formatMoney } from '../../utils/moneyFormat.js';

const ReportProfitTab = ({ range, onRangeChange }) => {
  const { items: invoices } = useInvoiceStore();
  const { items: cashbook } = useCashbookStore();

  const filteredInvoices = useMemo(() => {
    if (!range[0] || !range[1]) return invoices;
    return invoices.filter((invoice) =>
      !dayjs(invoice.date).isBefore(dayjs(range[0]).startOf('day')) &&
      !dayjs(invoice.date).isAfter(dayjs(range[1]).endOf('day'))
    );
  }, [invoices, range]);

  const profitRows = useMemo(() => computeProfitByDay(filteredInvoices), [filteredInvoices]);

  const profitExport = useMemo(
    () =>
      profitRows.map((row) => ({
        Ngay: dayjs(row.date).format('DD/MM/YYYY'),
        Doanh_thu: row.revenue,
        Gia_von: row.cost,
        Lai: row.profit,
      })),
    [profitRows]
  );

  const summary = useMemo(() => {
    const revenue = filteredInvoices.reduce((sum, inv) => sum + Number(inv.total || 0), 0);
    const cost = filteredInvoices.reduce((sum, inv) => {
      const invCost = (inv.items || []).reduce((acc, item) => {
        const qty = Number(item.qty || 0);
        const unitCost = Number(item.costPriceSnapshot || 0);
        const length = Number(item.length || 0);
        const width = Number(item.width || 0);
        const area = length > 0 && width > 0 ? length * width : 1;
        return acc + qty * unitCost * area;
      }, 0);
      return sum + invCost;
    }, 0);
    const profit = revenue - cost;

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

    return { revenue, cost, profit, cashIn, cashOut };
  }, [filteredInvoices, cashbook, range]);

  return (
    <div>
      <div className="action-row">
        <DateRangeFilter value={range} onChange={onRangeChange} />
        <ExportButton rows={profitExport} fileName="doanh-thu" sheetName="DoanhThu" />
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
            {profitRows.map((row) => (
              <tr key={row.date}>
                <td>{dayjs(row.date).format('DD/MM/YYYY')}</td>
                <td>{formatMoney(row.revenue)}</td>
                <td>{formatMoney(row.cost)}</td>
                <td>{formatMoney(row.profit)}</td>
              </tr>
            ))}
            {!profitRows.length && (
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
