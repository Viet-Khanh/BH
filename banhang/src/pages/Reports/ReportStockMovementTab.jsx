import { useCallback, useEffect, useMemo, useState } from 'react';
import { Input, message } from 'antd';
import DateRangeFilter from '../../components/DateRangeFilter.jsx';
import ExportActions from '../../components/ExportActions.jsx';
import { getStockMovementReport } from '../../features/reports/api/reportsApi.js';
import { buildMonthToDateRange } from '../../features/reports/domain/reportFilters.js';
import { useReportFilters } from '../../features/reports/hooks/useReportFilters.js';
import StockCardModal from './components/StockCardModal.jsx';
import StockMovementTable from './components/StockMovementTable.jsx';
import {
  buildStockMovementExportRow,
  buildStockRangeLabels,
} from './reportStockMovementUtils.js';

const ReportStockMovementTab = () => {
  const defaultRange = useMemo(() => buildMonthToDateRange(), []);
  const { range, setRange } = useReportFilters({
    defaultRange,
    syncPagination: false,
  });
  const [keyword, setKeyword] = useState('');
  const [rows, setRows] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const labels = useMemo(() => buildStockRangeLabels(range), [range]);

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
    () => filteredRows.map(buildStockMovementExportRow),
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

      <div style={{ margin: '8px 0', color: '#5b6b69' }}>
        Bấm vào một dòng để xem thẻ kho (từng phiếu nhập/xuất và tồn sau mỗi
        phiếu).
      </div>
      <StockMovementTable
        rows={filteredRows}
        labels={labels}
        onSelect={setSelectedProduct}
      />
      <StockCardModal
        product={selectedProduct}
        range={range}
        labels={labels}
        onClose={() => setSelectedProduct(null)}
      />
    </div>
  );
};

export default ReportStockMovementTab;
