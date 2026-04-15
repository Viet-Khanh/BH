import { useCallback, useEffect, useMemo, useState } from 'react';
import { message } from 'antd';
import {
  getPurchaseDetailsReport,
  getSuppliers,
} from '../../../features/reports/api/reportsApi.js';
import { useReportFilters } from '../../../features/reports/hooks/useReportFilters.js';
import {
  buildPurchaseDetailsExportRows,
  buildPurchaseDetailsSummary,
  groupPurchaseDetailRows,
} from '../reportPurchaseDetailsUtils.js';

export const useReportPurchaseDetailsState = () => {
  const filters = useReportFilters({ entityKey: 'supplierId' });
  const { range, entityId: supplierId, page, pageSize, setPage } = filters;
  const [rows, setRows] = useState([]);
  const [detailRows, setDetailRows] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [total, setTotal] = useState(0);
  const [summary, setSummary] = useState({
    amount: 0,
    paid: 0,
    remain: 0,
    totalPay: 0,
  });

  useEffect(() => {
    let active = true;
    const loadSuppliers = async () => {
      try {
        const data = await getSuppliers();
        if (active) {
          setSuppliers(Array.isArray(data) ? data : []);
        }
      } catch (error) {
        if (active) {
          message.error('Không thể tải danh sách nhà cung cấp.');
        }
      }
    };
    loadSuppliers();
    return () => {
      active = false;
    };
  }, []);

  const refreshReport = useCallback(async () => {
    const data = await getPurchaseDetailsReport({
      range,
      supplierId,
      page,
      pageSize,
    });
    const nextRows = Array.isArray(data?.rows) ? data.rows : [];
    const nextDetailRows = Array.isArray(data?.exportRows)
      ? data.exportRows
      : [];
    const backendSummary = data?.summary;
    const pagination = data?.pagination || {};

    setRows(nextRows);
    setDetailRows(nextDetailRows);
    setSummary(
      backendSummary
        ? {
            amount: Number(backendSummary.amount || 0),
            paid: Number(backendSummary.paid || 0),
            remain: Number(backendSummary.remain || 0),
            totalPay: Number(backendSummary.totalPay || 0),
          }
        : buildPurchaseDetailsSummary(nextRows)
    );
    setTotal(Number(pagination.total || nextRows.length || 0));
    if (pagination.page && Number(pagination.page) !== page) {
      setPage(Number(pagination.page));
    }
  }, [page, pageSize, range, setPage, supplierId]);

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        await refreshReport();
      } catch (error) {
        if (active) {
          message.error('Không thể tải chi tiết nhập hàng.');
        }
      }
    };
    load();
    return () => {
      active = false;
    };
  }, [refreshReport]);

  const supplierMap = useMemo(
    () =>
      suppliers.reduce((acc, supplier) => {
        acc[supplier.id] = supplier;
        return acc;
      }, {}),
    [suppliers]
  );
  const supplierOptions = useMemo(
    () => suppliers.map((item) => ({ value: item.id, label: item.name })),
    [suppliers]
  );
  const selectedSupplierName = useMemo(
    () => suppliers.find((item) => item.id === supplierId)?.name || '',
    [supplierId, suppliers]
  );
  const groupedRows = useMemo(
    () => groupPurchaseDetailRows({ rows, detailRows, supplierMap }),
    [detailRows, rows, supplierMap]
  );
  const exportTitle = selectedSupplierName
    ? `Chi tiết nhập hàng - Nhà cung cấp: ${selectedSupplierName}`
    : 'Chi tiết nhập hàng';
  const exportRows = useMemo(
    () => buildPurchaseDetailsExportRows({ rows: groupedRows }),
    [groupedRows]
  );
  const pdfRows = useMemo(
    () =>
      buildPurchaseDetailsExportRows({ rows: groupedRows, formatted: true }),
    [groupedRows]
  );

  return {
    ...filters,
    exportRows,
    exportTitle,
    groupedRows,
    pdfRows,
    summary,
    supplierOptions,
    total,
  };
};
