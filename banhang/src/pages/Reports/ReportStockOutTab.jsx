import { useCallback, useEffect, useMemo, useState } from 'react';
import { Select, message } from 'antd';
import DateRangeFilter from '../../components/DateRangeFilter.jsx';
import ExportActions from '../../components/ExportActions.jsx';
import { getSalesDetailsReport } from '../../features/reports/api/reportsApi.js';
import { buildDefaultRange } from '../../features/reports/domain/reportFilters.js';
import { useReportFilters } from '../../features/reports/hooks/useReportFilters.js';
import { formatMoney } from '../../utils/moneyFormat.js';

const buildExportRow = (
  row,
  { formatted = false, includeProfit = true } = {}
) => ({
  'Tên hàng': row.name,
  ĐVT: row.unit,
  'Quy cách': row.spec,
  'Số lượng': row.qty,
  'Thành tiền': formatted ? formatMoney(row.amount) : row.amount,
  'Tiền vốn': formatted ? formatMoney(row.cost) : row.cost,
  ...(includeProfit
    ? { 'Lợi nhuận': formatted ? formatMoney(row.profit) : row.profit }
    : {}),
});

const ReportStockOutTab = ({ showSensitiveInfo = false }) => {
  const defaultRange = useMemo(() => buildDefaultRange(), []);
  const {
    range,
    setRange,
    entityId: customerId,
    setEntityId: setCustomerId,
  } = useReportFilters({
    entityKey: 'customerId',
    defaultRange,
    syncPagination: false,
  });
  const [rows, setRows] = useState([]);
  const [customers, setCustomers] = useState([]);

  const selectedCustomerName = useMemo(
    () => customers.find((item) => item.id === customerId)?.name || '',
    [customers, customerId]
  );
  const exportTitle = selectedCustomerName
    ? `Báo cáo xuất kho - Khách hàng: ${selectedCustomerName}`
    : 'Báo cáo xuất kho';

  const fetchReport = useCallback(async () => {
    const data = await getSalesDetailsReport({ range, customerId });
    setRows(Array.isArray(data?.rows) ? data.rows : []);
    setCustomers(Array.isArray(data?.customers) ? data.customers : []);
  }, [range, customerId]);

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        await fetchReport();
      } catch (error) {
        if (active) {
          message.error(
            `Không thể tải báo cáo xuất kho: ${error.message || 'Lỗi không xác định'}`
          );
        }
      }
    };
    load();
    return () => {
      active = false;
    };
  }, [fetchReport]);

  const itemRows = useMemo(() => {
    const map = new Map();
    rows.forEach((row) => {
      (row.items || []).forEach((item) => {
        const key = item.productId || `${item.name}-${item.unit}-${item.spec}`;
        const current = map.get(key) || {
          productId: item.productId || '',
          name: item.name || 'Sản phẩm',
          unit: item.unit || '',
          spec: item.spec || '',
          qty: 0,
          amount: 0,
          cost: 0,
          profit: 0,
        };
        const qty = Number(item.qty || 0);
        const amount = Number(item.lineTotal || 0);
        const cost = Number(item.costTotal ?? 0);
        const profit = Number(item.profit ?? amount - cost);

        current.qty += qty;
        current.amount += amount;
        current.cost += cost;
        current.profit += profit;

        map.set(key, current);
      });
    });

    return Array.from(map.values()).sort((a, b) =>
      String(a.name || '').localeCompare(String(b.name || ''), 'vi', {
        sensitivity: 'base',
      })
    );
  }, [rows]);

  const summary = useMemo(
    () =>
      itemRows.reduce(
        (acc, row) => ({
          amount: acc.amount + Number(row.amount || 0),
          cost: acc.cost + Number(row.cost || 0),
          profit: acc.profit + Number(row.profit || 0),
        }),
        { amount: 0, cost: 0, profit: 0 }
      ),
    [itemRows]
  );

  const exportRows = useMemo(
    () =>
      itemRows.map((row) =>
        buildExportRow(row, {
          includeProfit: showSensitiveInfo,
        })
      ),
    [itemRows, showSensitiveInfo]
  );
  const pdfRows = useMemo(
    () =>
      itemRows.map((row) =>
        buildExportRow(row, {
          formatted: true,
          includeProfit: showSensitiveInfo,
        })
      ),
    [itemRows, showSensitiveInfo]
  );

  return (
    <div>
      <div className="action-row">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <span style={{ fontWeight: 600 }}>Theo ngày</span>
          <DateRangeFilter value={range} onChange={setRange} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <span style={{ fontWeight: 600 }}>Khách hàng</span>
          <Select
            allowClear
            placeholder="Chọn khách hàng"
            value={customerId || undefined}
            onChange={(value) => setCustomerId(value || '')}
            options={customers.map((item) => ({
              value: item.id,
              label: item.name,
            }))}
            style={{ minWidth: 220 }}
            size="large"
            showSearch
            optionFilterProp="label"
          />
        </div>
        <div style={{ display: 'flex', alignItems: 'end', marginLeft: 'auto' }}>
          <ExportActions
            rows={exportRows}
            pdfRows={pdfRows}
            fileName="xuat-kho"
            sheetName="XuatKho"
            title={exportTitle}
          />
        </div>
      </div>

      <div className="section-title">Tổng hợp</div>
      <div className="invoice-summary">
        <span>
          Thành tiền:{' '}
          <span className="text-success">{formatMoney(summary.amount)}</span>
        </span>
        <span>
          Tiền vốn:{' '}
          <span className="text-danger">{formatMoney(summary.cost)}</span>
        </span>
        {showSensitiveInfo && (
          <span>
            Lợi nhuận:{' '}
            <span
              className={summary.profit >= 0 ? 'text-success' : 'text-danger'}
            >
              {formatMoney(summary.profit)}
            </span>
          </span>
        )}
      </div>

      <div className="section-title">Mặt hàng xuất kho</div>
      <div className="table-wrapper">
        <table className="invoice-items-table">
          <thead>
            <tr>
              <th>Tên hàng</th>
              <th>ĐVT</th>
              <th>Số lượng</th>
              <th>Thành tiền</th>
              <th>Tiền vốn</th>
              {showSensitiveInfo && <th>Lợi nhuận</th>}
            </tr>
          </thead>
          <tbody>
            {itemRows.map((row) => (
              <tr key={row.productId || `${row.name}-${row.unit}-${row.spec}`}>
                <td>{row.name}</td>
                <td>{row.unit}</td>
                <td>{row.qty}</td>
                <td className="text-success">{formatMoney(row.amount)}</td>
                <td className="text-danger">{formatMoney(row.cost)}</td>
                {showSensitiveInfo && (
                  <td
                    className={row.profit >= 0 ? 'text-success' : 'text-danger'}
                  >
                    {formatMoney(row.profit)}
                  </td>
                )}
              </tr>
            ))}
            {!itemRows.length && (
              <tr>
                <td colSpan={showSensitiveInfo ? 6 : 5}>Chưa có dữ liệu.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ReportStockOutTab;
