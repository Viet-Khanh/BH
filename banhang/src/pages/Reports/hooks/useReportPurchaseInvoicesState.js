import { useCallback, useEffect, useMemo, useState } from 'react';
import { message } from 'antd';
import {
  getPurchaseInvoicesReport,
  getSuppliers,
} from '../../../features/reports/api/reportsApi.js';
import { useReportFilters } from '../../../features/reports/hooks/useReportFilters.js';
import { buildPurchaseInvoiceExportRow } from '../reportPurchaseUtils.js';

export const useReportPurchaseInvoicesState = () => {
  const filters = useReportFilters({
    entityKey: 'supplierId',
    defaultPageSize: 100,
  });
  const { range, entityId: supplierId, page, pageSize, setPage } = filters;
  const [rows, setRows] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [total, setTotal] = useState(0);

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
    const data = await getPurchaseInvoicesReport({
      range,
      supplierId,
      page,
      pageSize,
    });
    const nextRows = Array.isArray(data?.rows) ? data.rows : [];
    const pagination = data?.pagination || {};

    setRows(nextRows);
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
          message.error('Không thể tải hóa đơn nhập hàng.');
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
  const selectedSupplierName = supplierId
    ? supplierMap[supplierId]?.name || ''
    : '';
  const exportTitle = selectedSupplierName
    ? `Hóa đơn nhập hàng - Nhà cung cấp: ${selectedSupplierName}`
    : 'Hóa đơn nhập hàng';
  const exportRows = useMemo(
    () => rows.map((row) => buildPurchaseInvoiceExportRow(row)),
    [rows]
  );

  return {
    ...filters,
    exportRows,
    exportTitle,
    refreshReport,
    rows,
    supplierMap,
    supplierOptions,
    total,
  };
};
