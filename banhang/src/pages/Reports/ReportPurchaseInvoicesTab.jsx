import { useCallback, useEffect, useMemo, useState } from 'react';
import { Modal, Select, message } from 'antd';
import dayjs from 'dayjs';
import { useNavigate } from 'react-router-dom';
import * as XLSX from 'xlsx';
import DateRangeFilter from '../../components/DateRangeFilter.jsx';
import ExportActions from '../../components/ExportActions.jsx';
import ReportPurchaseInvoiceModal from './ReportPurchaseInvoiceModal.jsx';
import { apiRequest } from '../../db/repository.js';
import { formatMoney } from '../../utils/moneyFormat.js';
import { saveWorkbook } from '../../utils/excelExport.js';
import { printHtml } from '../../utils/printUtils.js';
import { renderInvoiceTemplate } from '../../utils/renderTemplate.js';
import { useSettingsStore } from '../../store/settingsStore.js';

const ReportPurchaseInvoicesTab = () => {
  const navigate = useNavigate();
  const { settings, load: loadSettings } = useSettingsStore();

  const [range, setRange] = useState(() => [
    dayjs().startOf('day').toISOString(),
    dayjs().endOf('day').toISOString(),
  ]);
  const [supplierId, setSupplierId] = useState('');
  const [rows, setRows] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [selectedPurchaseId, setSelectedPurchaseId] = useState(null);
  const [selectedPurchase, setSelectedPurchase] = useState(null);
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [selectedPayments, setSelectedPayments] = useState([]);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

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
      setSelectedSupplier(null);
      setSelectedProducts([]);
      setSelectedPayments([]);
      return;
    }

    let active = true;
    const loadDetail = async () => {
      try {
        const data = await apiRequest(`/purchases-tools/detail/${selectedPurchaseId}`);
        if (!active) return;
        setSelectedPurchase(data?.purchase || null);
        setSelectedSupplier(data?.supplier || null);
        setSelectedProducts(Array.isArray(data?.products) ? data.products : []);
        setSelectedPayments(Array.isArray(data?.payments) ? data.payments : []);
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

  const selectedProductMap = useMemo(
    () =>
      selectedProducts.reduce((acc, item) => {
        acc[item.id] = item;
        return acc;
      }, {}),
    [selectedProducts]
  );

  const selectedItems = useMemo(
    () =>
      (selectedPurchase?.items || []).map((item, index) => {
        const product = selectedProductMap[item.productId] || {};
        return {
          key: `${item.productId || 'item'}-${index}`,
          productId: item.productId,
          name: product.name || '',
          unit: product.unit || '',
          spec: product.spec || '',
          qty: item.qty,
          unitCost: item.unitCost,
          lineTotal: item.lineTotal,
          note: item.lineNote || '',
        };
      }),
    [selectedPurchase, selectedProductMap]
  );

  const selectedPurchaseForPrint = useMemo(() => {
    if (!selectedPurchase) return null;
    return {
      ...selectedPurchase,
      customerDebt: 0,
      items: (selectedPurchase.items || []).map((item) => ({
        ...item,
        unitPrice: item.unitCost,
        note: item.lineNote || '',
      })),
    };
  }, [selectedPurchase]);

  const previewHtml = useMemo(() => {
    if (!selectedPurchaseForPrint || !settings) return '';
    return renderInvoiceTemplate({
      template: settings.invoiceTemplateHtml,
      invoice: selectedPurchaseForPrint,
      customer: selectedSupplier || { name: '' },
      payments: selectedPayments,
      products: selectedProducts,
      settings,
    });
  }, [selectedPurchaseForPrint, selectedSupplier, selectedPayments, selectedProducts, settings]);

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

  const handleDelete = () => {
    if (!selectedPurchase) return;
    Modal.confirm({
      title: 'Xóa phiếu nhập?',
      content: 'Thao tác này không thể hoàn tác.',
      okText: 'Xóa',
      cancelText: 'Hủy',
      onOk: async () => {
        try {
          await apiRequest(`/purchases/${selectedPurchase.id}`, { method: 'DELETE' });
          setSelectedPurchaseId(null);
          await fetchReport();
          message.success('Đã xóa phiếu nhập.');
        } catch (error) {
          message.error(`Không thể xóa phiếu nhập: ${error.message || 'Lỗi không xác định'}`);
        }
      },
    });
  };

  const handleEdit = () => {
    if (!selectedPurchase) return;
    setSelectedPurchaseId(null);
    navigate('/purchases', { state: { editPurchaseId: selectedPurchase.id, editMode: 'full' } });
  };

  const handlePrint = async () => {
    if (!previewHtml) return;
    const printCopies = Math.max(1, Math.round(Number(settings?.printCopies || 1)));
    await printHtml(previewHtml, { copies: printCopies, autoPageSize: true });
  };

  const handleExport = async () => {
    if (!selectedPurchase) return;
    const rowsToExport = selectedItems.map((item, index) => ({
      STT: index + 1,
      Ten_hang: item.name,
      DVT: item.unit,
      Quy_cach: item.spec,
      So_luong: item.qty,
      Don_gia: item.unitCost,
      Thanh_tien: item.lineTotal,
      Ghi_chu: item.note,
    }));
    if (!rowsToExport.length) {
      message.warning('Không có dữ liệu để xuất.');
      return;
    }
    const worksheet = XLSX.utils.json_to_sheet(rowsToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Hoa_don');
    await saveWorkbook(workbook, selectedPurchase.code || 'hoa-don');
  };

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
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr
                key={row.id}
                onClick={() => setSelectedPurchaseId(row.id)}
                style={{ cursor: 'pointer' }}
              >
                <td>{row.code}</td>
                <td>{row.date ? dayjs(row.date).format('DD/MM/YYYY') : ''}</td>
                <td>{supplierMap[row.supplierId]?.name || ''}</td>
                <td>{formatMoney(row.total)}</td>
                <td>{row.note}</td>
              </tr>
            ))}
            {!rows.length && (
              <tr>
                <td colSpan={5} style={{ textAlign: 'center' }}>
                  Chưa có hóa đơn nhập hàng.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <ReportPurchaseInvoiceModal
        open={!!selectedPurchase}
        purchase={selectedPurchase}
        supplier={selectedSupplier || supplierMap[selectedPurchase?.supplierId] || null}
        items={selectedItems}
        onClose={() => setSelectedPurchaseId(null)}
        onDelete={handleDelete}
        onEdit={handleEdit}
        onPrint={handlePrint}
        onExport={handleExport}
      />
    </div>
  );
};

export default ReportPurchaseInvoicesTab;
