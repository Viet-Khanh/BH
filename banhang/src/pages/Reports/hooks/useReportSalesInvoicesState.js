import { useCallback, useEffect, useMemo, useState } from 'react';
import { message } from 'antd';
import {
  getCustomerDebtTimelineReport,
  getSalesInvoicesReport,
} from '../../../features/reports/api/reportsApi.js';
import { useReportFilters } from '../../../features/reports/hooks/useReportFilters.js';
import {
  EMPTY_DEBT_TIMELINE,
  buildSalesInvoiceDisplayRows,
  buildSalesInvoiceExportRow,
  buildSalesInvoiceReportSummary,
} from '../reportSalesInvoiceUtils.js';

export const useReportSalesInvoicesState = ({
  showSensitiveInfo = false,
} = {}) => {
  const filters = useReportFilters({ entityKey: 'customerId' });
  const { range, entityId: customerId, page, pageSize, setPage } = filters;
  const [rows, setRows] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [total, setTotal] = useState(0);
  const [debtTimeline, setDebtTimeline] = useState(EMPTY_DEBT_TIMELINE);
  const [debtTimelineLoading, setDebtTimelineLoading] = useState(false);

  const selectedCustomerName = useMemo(
    () => customers.find((item) => item.id === customerId)?.name || '',
    [customers, customerId]
  );
  const exportTitle = selectedCustomerName
    ? `Báo cáo hóa đơn bán hàng - Khách hàng: ${selectedCustomerName}`
    : 'Báo cáo hóa đơn bán hàng';

  const refreshReport = useCallback(async () => {
    const data = await getSalesInvoicesReport({
      range,
      customerId,
      page,
      pageSize,
    });
    const nextRows = Array.isArray(data?.rows) ? data.rows : [];
    const nextCustomers = Array.isArray(data?.customers) ? data.customers : [];
    const pagination = data?.pagination || {};

    setRows(nextRows);
    setCustomers(nextCustomers);
    setTotal(Number(pagination.total || nextRows.length || 0));
    if (pagination.page && Number(pagination.page) !== page) {
      setPage(Number(pagination.page));
    }
  }, [customerId, page, pageSize, range, setPage]);

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        await refreshReport();
      } catch (error) {
        if (active) {
          message.error(
            `Không thể tải hóa đơn: ${error.message || 'Lỗi không xác định'}`
          );
        }
      }
    };
    load();
    return () => {
      active = false;
    };
  }, [refreshReport]);

  useEffect(() => {
    if (!customerId) {
      setDebtTimeline(EMPTY_DEBT_TIMELINE);
      setDebtTimelineLoading(false);
      return;
    }

    let active = true;
    setDebtTimeline(EMPTY_DEBT_TIMELINE);
    setDebtTimelineLoading(true);

    const loadDebtTimeline = async () => {
      try {
        const data = await getCustomerDebtTimelineReport({
          customerId,
          range,
          mode: 'invoice-order',
        });
        if (!active) return;
        setDebtTimeline({
          openingBalance: Number(data?.openingBalance || 0),
          closingBalance: Number(data?.closingBalance || 0),
          rows: Array.isArray(data?.rows) ? data.rows : [],
        });
      } catch (error) {
        if (active) {
          setDebtTimeline(EMPTY_DEBT_TIMELINE);
          message.error(
            `Không thể tải diễn biến công nợ: ${error.message || 'Lỗi không xác định'}`
          );
        }
      } finally {
        if (active) {
          setDebtTimelineLoading(false);
        }
      }
    };

    loadDebtTimeline();
    return () => {
      active = false;
    };
  }, [customerId, range]);

  const displayRows = useMemo(
    () =>
      buildSalesInvoiceDisplayRows({
        rows,
        debtTimelineRows: debtTimeline.rows,
        customerId,
        page,
        pageSize,
      }),
    [customerId, debtTimeline.rows, page, pageSize, rows]
  );

  const summary = useMemo(
    () =>
      buildSalesInvoiceReportSummary(displayRows, {
        timelineMode: Boolean(customerId),
      }),
    [customerId, displayRows]
  );

  const exportRows = useMemo(
    () =>
      displayRows.map((row) =>
        buildSalesInvoiceExportRow(row, {
          includeProfit: showSensitiveInfo,
        })
      ),
    [displayRows, showSensitiveInfo]
  );
  const pdfRows = useMemo(
    () =>
      displayRows.map((row) =>
        buildSalesInvoiceExportRow(row, {
          formatted: true,
          includeProfit: showSensitiveInfo,
        })
      ),
    [displayRows, showSensitiveInfo]
  );

  return {
    ...filters,
    customers,
    debtTimelineLoading,
    displayRows,
    exportRows,
    exportTitle,
    pdfRows,
    refreshReport,
    summary,
    total,
  };
};
