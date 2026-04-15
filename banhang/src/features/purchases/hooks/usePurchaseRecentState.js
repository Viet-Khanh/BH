import { useCallback, useEffect, useState } from 'react';
import { message } from 'antd';
import { getRecentPurchases } from '../api/purchasesApi.js';

export const usePurchaseRecentState = () => {
  const [recentOpen, setRecentOpen] = useState(false);
  const [recentPurchases, setRecentPurchases] = useState([]);
  const [exportRows, setExportRows] = useState([]);
  const [filterRange, setFilterRange] = useState([null, null]);
  const [filterSupplier, setFilterSupplier] = useState('');
  const [detailOpen, setDetailOpen] = useState(false);
  const [detail, setDetail] = useState(null);

  const loadRecentPurchases = useCallback(async () => {
    try {
      const data = await getRecentPurchases({
        limit: 200,
        supplierId: filterSupplier || undefined,
        from: filterRange[0] || undefined,
        to: filterRange[1] || undefined,
      });
      setRecentPurchases(Array.isArray(data?.rows) ? data.rows : []);
      setExportRows(Array.isArray(data?.exportRows) ? data.exportRows : []);
    } catch (error) {
      message.error('Không thể tải phiếu nhập.');
    }
  }, [filterRange, filterSupplier]);

  useEffect(() => {
    if (!recentOpen) return;
    loadRecentPurchases();
  }, [loadRecentPurchases, recentOpen]);

  return {
    recentOpen,
    setRecentOpen,
    recentPurchases,
    exportRows,
    filterRange,
    setFilterRange,
    filterSupplier,
    setFilterSupplier,
    loadRecentPurchases,
    detailOpen,
    setDetailOpen,
    detail,
    setDetail,
  };
};
