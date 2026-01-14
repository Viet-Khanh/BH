import { useCallback, useEffect, useMemo, useState } from 'react';
import { Button, Select, message } from 'antd';
import dayjs from 'dayjs';
import DateRangeFilter from '../../components/DateRangeFilter.jsx';
import ExportActions from '../../components/ExportActions.jsx';
import PurchaseDetailModal from '../Purchases/PurchaseDetailModal.jsx';
import { apiRequest } from '../../db/repository.js';
import { formatMoney } from '../../utils/moneyFormat.js';

const ReportPurchaseInvoicesTab = () => {
  const [range, setRange] = useState(() => [
    dayjs().startOf('day').toISOString(),
    dayjs().endOf('day').toISOString(),
  ]);
  const [supplierId, setSupplierId] = useState('');
  const [rows, setRows] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [selectedPurchaseId, setSelectedPurchaseId] = useState(null);
  const [selectedPurchase, setSelectedPurchase] = useState(null);
  const [selectedProducts, setSelectedProducts] = useState([]);

  useEffect(() => {
    let active = true;
    const loadSuppliers = async () => {
      try {
        const data = await apiRequest('/suppliers');
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

  const fetchReport = useCallback(async () => {
    const params = new URLSearchParams({ limit: '1000' });
    if (supplierId) params.set('supplierId', supplierId);
    if (range[0]) params.set('from', range[0]);
    if (range[1]) params.set('to', range[1]);
    const data = await apiRequest(`/purchases-tools/recent?${params.toString()}`);
    setRows(Array.isArray(data?.rows) ? data.rows : []);
  }, [range, supplierId]);

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        await fetchReport();
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
  }, [fetchReport]);

  useEffect(() => {
    if (!selectedPurchaseId) {
      setSelectedPurchase(null);
      setSelectedProducts([]);
      return;
    }

    let active = true;
    const loadDetail = async () => {
      try {
        const data = await apiRequest(`/purchases-tools/detail/${selectedPurchaseId}`);
        if (!active) return;
        setSelectedPurchase(data?.purchase || null);
        setSelectedProducts(Array.isArray(data?.products) ? data.products : []);
      } catch (error) {
        if (active) {
          message.error('Không thể tải chi tiết phiếu nhập.');
        }
      }
    };
    loadDetail();
    return () => {
      active = false;
    };
  }, [selectedPurchaseId]);

  const supplierMap = useMemo(() => {
    return suppliers.reduce((acc, supplier) => {
      acc[supplier.id] = supplier;
      return acc;
    }, {});
  }, [suppliers]);

  const supplierOptions = useMemo(
    () => suppliers.map((item) => ({ value: item.id, label: item.name })),
    [suppliers]
  );
  const selectedSupplierName = supplierId ? supplierMap[supplierId]?.name || '' : '';
  const exportTitle = selectedSupplierName
    ? `Hóa đơn nhập hàng - Nhà cung cấp: ${selectedSupplierName}`
    : 'Hóa đơn nhập hàng';

  const exportRows = useMemo(
    () =>
      rows.map((row) => ({
        Ma_phieu: row.code,
        Ngay: row.date ? dayjs(row.date).format('DD/MM/YYYY') : '',
        Nha_cung_cap: supplierMap[row.supplierId]?.name || '',
        Tong_tien: row.total,
        Ghi_chu: row.note,
      })),
    [rows, supplierMap]
  );

  return (
    <div>
      <div className="action-row">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <span style={{ fontWeight: 600 }}>Theo ngày</span>
          <DateRangeFilter value={range} onChange={setRange} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <span style={{ fontWeight: 600 }}>Nhà cung cấp</span>
          <Select
            allowClear
            placeholder="Chọn nhà cung cấp"
            value={supplierId || undefined}
            onChange={(value) => setSupplierId(value || '')}
            options={supplierOptions}
            style={{ minWidth: 220 }}
            size="large"
            showSearch
            optionFilterProp="label"
          />
        </div>
        <div style={{ display: 'flex', alignItems: 'end' }}>
          <ExportActions
            rows={exportRows}
            fileName="hoa-don-nhap-hang"
            sheetName="HoaDonNhap"
            title={exportTitle}
          />
        </div>
      </div>

      <div className="pos-table">
        <table>
          <thead>
            <tr>
              <th>Mã phiếu</th>
              <th>Ngày</th>
              <th>Nhà cung cấp</th>
              <th>Tổng tiền</th>
              <th>Ghi chú</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id}>
                <td>{row.code}</td>
                <td>{row.date ? dayjs(row.date).format('DD/MM/YYYY') : ''}</td>
                <td>{supplierMap[row.supplierId]?.name || ''}</td>
                <td>{formatMoney(row.total)}</td>
                <td>{row.note}</td>
                <td>
                  <Button size="small" onClick={() => setSelectedPurchaseId(row.id)}>
                    Xem
                  </Button>
                </td>
              </tr>
            ))}
            {!rows.length && (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center' }}>
                  Chưa có hóa đơn nhập hàng.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <PurchaseDetailModal
        open={!!selectedPurchase}
        detail={selectedPurchase}
        products={selectedProducts}
        onClose={() => setSelectedPurchaseId(null)}
      />
    </div>
  );
};

export default ReportPurchaseInvoicesTab;
