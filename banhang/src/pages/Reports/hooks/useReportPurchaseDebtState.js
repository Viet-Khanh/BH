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

  const handleView = useCallback(async (row) => {
    if (!row?.supplier?.id) return;
    try {
      const data = await getSupplierDebtDetail(row.supplier.id);
      setDebtDetail(data);
    } catch (error) {
      message.error(
        `Không thể tải chi tiết công nợ: ${error.message || 'Lỗi không xác định'}`
      );
    }
  }, []);

  return {
    closeDebtDetail: () => setDebtDetail(null),
    debtDetail,
    debtExport,
    handleView,
    rows,
  };
};
