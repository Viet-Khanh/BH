import { useCallback, useEffect, useMemo, useState } from 'react';
import { message } from 'antd';
import {
  getCustomerDebtDetail,
  getCustomerDebtReport,
  getCustomerDebtTimelineReport,
} from '../../../features/reports/api/reportsApi.js';
import { hasSearchMatch } from '../../../utils/searchText.js';
import {
  buildCustomerDebtExportRows,
  buildCustomerDebtSummaryItems,
  buildCustomerDebtTotals,
} from '../reportDebtUtils.js';

export const useReportDebtState = () => {
  const [rows, setRows] = useState([]);
  const [debtDetail, setDebtDetail] = useState(null);
  const [debtTimelineRows, setDebtTimelineRows] = useState([]);
  const [keyword, setKeyword] = useState('');
  const [debtDetailTab, setDebtDetailTab] = useState('active');

  const loadDebtRows = useCallback(async () => {
    const data = await getCustomerDebtReport();
    const nextRows = Array.isArray(data?.rows) ? data.rows : [];
    setRows(nextRows);
    return nextRows;
  }, []);

  const loadDebtDetail = useCallback(async (customerId) => {
    if (!customerId) return null;
    const data = await getCustomerDebtDetail(customerId);
    setDebtDetail(data);
    return data;
  }, []);

  const loadDebtTimeline = useCallback(async (customerId) => {
    if (!customerId) {
      setDebtTimelineRows([]);
      return [];
    }
    const data = await getCustomerDebtTimelineReport({ customerId });
    const nextRows = Array.isArray(data?.rows) ? data.rows : [];
    setDebtTimelineRows(nextRows);
    return nextRows;
  }, []);

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        await loadDebtRows();
      } catch (error) {
        if (active) {
          message.error(
            `Không thể tải công nợ: ${error.message || 'Lỗi không xác định'}`
          );
        }
      }
    };
    load();
    return () => {
      active = false;
    };
  }, [loadDebtRows]);

  const filteredRows = useMemo(
    () =>
      rows.filter((row) =>
        hasSearchMatch({ customerName: row.customer?.name }, keyword)
      ),
    [keyword, rows]
  );
  const debtExport = useMemo(
    () => buildCustomerDebtExportRows(filteredRows),
    [filteredRows]
  );
  const totals = useMemo(
    () => buildCustomerDebtTotals(filteredRows),
    [filteredRows]
  );
  const summaryItems = useMemo(
    () => buildCustomerDebtSummaryItems(totals),
    [totals]
  );

  const handleView = useCallback(
    async (row) => {
      if (!row?.customer?.id) return;
      try {
        await Promise.all([
          loadDebtDetail(row.customer.id),
          loadDebtTimeline(row.customer.id),
        ]);
      } catch (error) {
        message.error(
          `Không thể tải chi tiết công nợ: ${error.message || 'Lỗi không xác định'}`
        );
      }
    },
    [loadDebtDetail, loadDebtTimeline]
  );

  const closeDebtDetail = useCallback(() => {
    setDebtDetail(null);
    setDebtTimelineRows([]);
    setDebtDetailTab('active');
  }, []);

  return {
    closeDebtDetail,
    debtDetail,
    debtDetailTab,
    debtExport,
    debtTimelineRows,
    filteredRows,
    handleView,
    keyword,
    loadDebtDetail,
    loadDebtRows,
    loadDebtTimeline,
    setDebtDetailTab,
    setKeyword,
    summaryItems,
  };
};
