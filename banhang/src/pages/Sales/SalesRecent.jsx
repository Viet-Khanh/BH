import { useEffect, useMemo, useState } from 'react';
import { Button, Modal, Select, message } from 'antd';
import { useLocation, useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import * as XLSX from 'xlsx';
import { useSettingsStore } from '../../store/settingsStore.js';
import { formatMoney } from '../../utils/moneyFormat.js';
import { renderInvoiceTemplate } from '../../utils/renderTemplate.js';
import { apiRequest } from '../../db/repository.js';
import { saveWorkbook } from '../../utils/excelExport.js';
import { printHtml } from '../../utils/printUtils.js';

const SalesRecent = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const initialFilter = params.get('debt') === '1' ? 'debt' : 'all';

  const { settings, load: loadSettings } = useSettingsStore();

  const [filterMode, setFilterMode] = useState(initialFilter);
  const [rows, setRows] = useState([]);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState(null);
  const [selectedInvoiceData, setSelectedInvoiceData] = useState(null);

  useEffect(() => {
    const bootstrap = async () => {
      await loadSettings();
    };
    bootstrap();
  }, [loadSettings]);

  const todayRange = useMemo(() => {
    const now = dayjs();
    return {
      from: now.startOf('day').toISOString(),
      to: now.endOf('day').toISOString(),
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    const loadRows = async () => {
      const params = new URLSearchParams({
        from: todayRange.from,
        to: todayRange.to,
      });
      try {
        const data = await apiRequest(
          `/reports/sales-invoices?${params.toString()}`
        );
        if (cancelled) return;
        setRows(Array.isArray(data?.rows) ? data.rows : []);
      } catch (error) {
        if (!cancelled) {
          message.error('Không thể tải hóa đơn hôm nay.');
        }
      }
    };
    loadRows();
    return () => {
      cancelled = true;
    };
  }, [todayRange.from, todayRange.to]);

  useEffect(() => {
    if (!selectedInvoiceId) {
      setSelectedInvoiceData(null);
      return;
    }
    let cancelled = false;
    const loadInvoice = async () => {
      try {
        const data = await apiRequest(`/reports/invoices/${selectedInvoiceId}`);
        if (!cancelled) {
          setSelectedInvoiceData(data);
        }
      } catch (error) {
        if (!cancelled) {
          message.error('Không thể tải chi tiết hóa đơn.');
        }
      }
    };
    loadInvoice();
    return () => {
      cancelled = true;
    };
  }, [selectedInvoiceId]);

  const filteredRows = useMemo(
    () => rows.filter((row) => (filterMode === 'debt' ? row.remain > 0 : true)),
    [rows, filterMode]
  );

  const selectedInvoice = selectedInvoiceData?.invoice || null;
  const selectedCustomer = selectedInvoiceData?.customer || null;
  const selectedPayments = selectedInvoiceData?.payments || [];
  const selectedItems = selectedInvoiceData?.items || [];
  const selectedProducts = selectedInvoiceData?.products || [];

  const previewHtml = useMemo(() => {
    if (!selectedInvoice || !settings) return '';
    return renderInvoiceTemplate({
      template: settings.invoiceTemplateHtml,
      invoice: selectedInvoice,
      customer: selectedCustomer || { name: 'Khách lẻ' },
      payments: selectedPayments,
      products: selectedProducts,
      settings,
    });
  }, [
    selectedInvoice,
    selectedCustomer,
    selectedPayments,
    selectedProducts,
    settings,
  ]);

  const handlePrint = async () => {
    if (!previewHtml) return;
    await printHtml(previewHtml, { copies: 1, autoPageSize: true });
  };

  const handleExport = async () => {
    if (!selectedInvoice) return;
    const rowsToExport = selectedItems.map((item, index) => ({
      STT: index + 1,
      Ten_hang: item.name,
      DVT: item.unit,
      Quy_cach: item.spec,
      So_luong: item.qty,
      Don_gia: item.unitPrice,
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
    await saveWorkbook(workbook, selectedInvoice.code || 'hoa-don');
  };

  const handleDelete = () => {
    if (!selectedInvoice) return;
    Modal.confirm({
      title: 'Xóa hóa đơn?',
      content: 'Thao tác này không thể hoàn tác.',
      okText: 'Xóa',
      cancelText: 'Hủy',
      onOk: async () => {
        await apiRequest(`/reports/invoices/${selectedInvoice.id}`, {
          method: 'DELETE',
        });
        setRows((prev) => prev.filter((row) => row.id !== selectedInvoice.id));
        setSelectedInvoiceId(null);
        message.success('Đã xóa hóa đơn.');
      },
    });
  };

  const handleEdit = () => {
    if (!selectedInvoice) return;
    setSelectedInvoiceId(null);
    navigate('/sales', { state: { editInvoiceId: selectedInvoice.id } });
  };

  return (
    <div className="page-card pos-shell">
      <div className="pos-header recent-header">
        <Button size="large" onClick={() => navigate('/sales')}>
          Quay lại
        </Button>
        <div className="pos-header-title">HÓA ĐƠN BÁN HÀNG GẦN ĐÂY</div>
        <div className="pos-header-actions">
          <Button size="large" onClick={() => navigate('/sales/history')}>
            Lịch sử sửa xóa
          </Button>
        </div>
      </div>

      <div className="recent-filter">
        <Select
          value={filterMode}
          onChange={setFilterMode}
          options={[
            { value: 'all', label: 'Tất cả' },
            { value: 'debt', label: 'Còn nợ' },
          ]}
        />
      </div>

      <div className="pos-table">
        <table>
          <thead>
            <tr>
              <th>Số HĐ</th>
              <th>Ngày</th>
              <th>Nhân viên</th>
              <th>MH</th>
              <th>SL</th>
              <th>Tiền hàng</th>
              <th>Nợ cũ</th>
              <th>Tổng cộng</th>
              <th>Đã thu</th>
              <th>Còn nợ</th>
              <th>Khách hàng</th>
              <th>Điện thoại</th>
              <th>Địa chỉ</th>
              <th>Ghi chú</th>
            </tr>
          </thead>
          <tbody>
            {filteredRows.map((row) => (
              <tr
                key={row.id}
                onClick={() => setSelectedInvoiceId(row.id)}
                style={{ cursor: 'pointer' }}
              >
                <td>{row.code}</td>
                <td>{dayjs(row.date).format('DD/MM/YY HH:mm')}</td>
                <td>{row.staff}</td>
                <td>{row.itemsCount}</td>
                <td>{row.qtySum}</td>
                <td>{formatMoney(row.amount)}</td>
                <td className="text-danger">{formatMoney(row.oldDebt)}</td>
                <td>{formatMoney(row.totalPay)}</td>
                <td className={row.paid > 0 ? 'text-success' : ''}>
                  {formatMoney(row.paid)}
                </td>
                <td className={row.remain > 0 ? 'text-danger' : 'text-success'}>
                  {formatMoney(row.remain)}
                </td>
                <td>{row.customerName}</td>
                <td>{row.phone}</td>
                <td>{row.address}</td>
                <td>{row.note}</td>
              </tr>
            ))}
            {!filteredRows.length && (
              <tr>
                <td colSpan={14} style={{ textAlign: 'center' }}>
                  Chưa có hóa đơn.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Modal
        title="PHIẾU BÁN HÀNG"
        open={!!selectedInvoice}
        onCancel={() => setSelectedInvoiceId(null)}
        footer={null}
        width={900}
      >
        {selectedInvoice && (
          <div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                gap: 16,
              }}
            >
              <div>
                HĐ: <strong>{selectedInvoice.code}</strong>
              </div>
              <div>
                KH: <strong>{selectedCustomer?.name || 'Khách lẻ'}</strong>
              </div>
              <div>
                Tổng tiền:{' '}
                <strong>{formatMoney(selectedInvoice.total || 0)}</strong>
              </div>
            </div>
            <div className="pos-table" style={{ marginTop: 12 }}>
              <table>
                <thead>
                  <tr>
                    <th>Tên hàng</th>
                    <th>ĐVT</th>
                    <th>T.SL</th>
                    <th>Đơn giá</th>
                    <th>Thành tiền</th>
                    <th>Ghi chú</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedItems.map((item) => (
                    <tr key={item.key}>
                      <td>{item.name}</td>
                      <td>{item.unit}</td>
                      <td>{item.qty}</td>
                      <td>{formatMoney(item.unitPrice)}</td>
                      <td>{formatMoney(item.lineTotal)}</td>
                      <td>{item.note}</td>
                    </tr>
                  ))}
                  {!selectedItems.length && (
                    <tr>
                      <td colSpan={7} style={{ textAlign: 'center' }}>
                        Chưa có hàng hóa.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginTop: 16,
                gap: 12,
              }}
            >
              <Button danger size="large" onClick={handleDelete}>
                XÓA
              </Button>
              <Button size="large" onClick={handleEdit}>
                SỬA
              </Button>
              <Button
                size="large"
                type="primary"
                className="btn-primary"
                onClick={handlePrint}
              >
                IN LẠI
              </Button>
              <Button size="large" onClick={handleExport}>
                Xuất File...
              </Button>
              <Button size="large" onClick={() => setSelectedInvoiceId(null)}>
                THOÁT
              </Button>
            </div>
            <div style={{ marginTop: 12, color: '#b91c1c', fontSize: 12 }}>
              * Chức năng SỬA, XÓA hóa đơn chỉ dành cho Khách lẻ, nếu khách có
              công nợ, chỉ áp dụng cho hóa đơn gần đây nhất.
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default SalesRecent;
