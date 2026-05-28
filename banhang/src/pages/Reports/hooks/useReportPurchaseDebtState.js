import { useCallback, useEffect, useMemo, useState } from 'react';
import { message } from 'antd';
import {
  getSupplierDebtDetail,
  getSupplierDebtReport,
} from '../../../features/reports/api/reportsApi.js';
import { buildSupplierDebtExportRows } from '../reportDebtUtils.js';

export const useReportPurchaseDebtState = () => {
  const [rows, setRows] = useState([]);
  const [debtDetail, setDebtDetail] = useState(null);
  const [debtDetailTab, setDebtDetailTab] = useState('active');

  const loadSupplierDebtRows = useCallback(async () => {
    const data = await getSupplierDebtReport();
    const nextRows = Array.isArray(data?.rows) ? data.rows : [];
    setRows(nextRows);
    return nextRows;
  }, []);

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        await loadSupplierDebtRows();
      } catch (error) {
        if (active) {
          message.error(
            `Không thể tải công nợ nhà cung cấp: ${
              error.message || 'Lỗi không xác định'
            }`
          );
        }
      }
    };
    load();
    return () => {
      active = false;
    };
  }, [loadSupplierDebtRows]);

  const debtExport = useMemo(() => buildSupplierDebtExportRows(rows), [rows]);

  const loadSupplierDebtDetail = useCallback(async (supplierId) => {
    if (!supplierId) return null;
    const data = await getSupplierDebtDetail(supplierId);
    setDebtDetail(data);
    return data;
  }, []);

  const handleView = useCallback(async (row) => {
    if (!row?.supplier?.id) return;
    try {
      await loadSupplierDebtDetail(row.supplier.id);
    } catch (error) {
      message.error(
        `Không thể tải chi tiết công nợ: ${error.message || 'Lỗi không xác định'}`
      );
    }
  }, [loadSupplierDebtDetail]);

  const closeDebtDetail = useCallback(() => {
    setDebtDetail(null);
    setDebtDetailTab('active');
  }, []);

  return {
    closeDebtDetail,
    debtDetail,
    debtDetailTab,
    debtExport,
    handleView,
    loadSupplierDebtDetail,
    loadSupplierDebtRows,
    rows,
    setDebtDetailTab,
  };
};
