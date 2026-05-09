import { useCallback, useEffect, useMemo, useState } from 'react';
import { message } from 'antd';
import { getSalesDetailsReport } from '../../../features/reports/api/reportsApi.js';
import { useReportFilters } from '../../../features/reports/hooks/useReportFilters.js';
import {
  buildSalesDetailsExportRows,
  buildSalesDetailsSummary,
} from '../reportSalesDetailsUtils.js';

export const useReportSalesDetailsState = ({
  showSensitiveInfo = false,
} = {}) => {
  const filters = useReportFilters({
    entityKey: 'customerId',
    defaultPageSize: 100,
  });
  const { range, entityId: customerId, page, pageSize, setPage } = filters;
  const [rows, setRows] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [total, setTotal] = useState(0);
  const [summary, setSummary] = useState({
    amount: 0,
    paid: 0,
    remain: 0,
    profit: 0,
  });

  const selectedCustomerName = useMemo(
    () => customers.find((item) => item.id === customerId)?.name || '',
    [customers, customerId]
  );
  const exportTitle = selectedCustomerName
    ? `Báo cáo chi tiết bán hàng - Khách hàng: ${selectedCustomerName}`
    : 'Báo cáo chi tiết bán hàng';

  const refreshReport = useCallback(async () => {
    const data = await getSalesDetailsReport({
      range,
      customerId,
      page,
      pageSize,
    });
    const nextRows = Array.isArray(data?.rows) ? data.rows : [];
    const nextCustomers = Array.isArray(data?.customers) ? data.customers : [];
    const backendSummary = data?.summary;
    const pagination = data?.pagination || {};

    setRows(nextRows);
    setCustomers(nextCustomers);
    setSummary(
      backendSummary
        ? {
            amount: Number(backendSummary.amount || 0),
            paid: Number(backendSummary.paid || 0),
            remain: Number(backendSummary.remain || 0),
            profit: Number(backendSummary.profit || 0),
          }
        : buildSalesDetailsSummary(nextRows)
    );
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
            `Không thể tải chi tiết bán hàng: ${error.message || 'Lỗi không xác định'}`
          );
        }
      }
    };
    load();
    return () => {
      active = false;
    };
  }, [refreshReport]);

  const exportRows = useMemo(
    () => buildSalesDetailsExportRows({ rows, showSensitiveInfo }),
    [rows, showSensitiveInfo]
  );
  const pdfRows = useMemo(
    () =>
      buildSalesDetailsExportRows({
        rows,
        showSensitiveInfo,
        formatted: true,
      }),
    [rows, showSensitiveInfo]
  );

  return {
    ...filters,
    customers,
    exportRows,
    exportTitle,
    pdfRows,
    rows,
    summary,
    total,
  };
};
