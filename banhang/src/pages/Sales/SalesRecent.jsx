import { useMemo, useState } from 'react';
import { Button, Modal, Select, message } from 'antd';
import { useLocation, useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import * as XLSX from 'xlsx';
import { useInvoiceStore } from '../../store/invoiceStore.js';
import { usePaymentStore } from '../../store/paymentStore.js';
import { useCustomerStore } from '../../store/customerStore.js';
import { useProductStore } from '../../store/productStore.js';
import { useSettingsStore } from '../../store/settingsStore.js';
import { formatMoney } from '../../utils/moneyFormat.js';
import { renderInvoiceTemplate } from '../../utils/renderTemplate.js';

const SalesRecent = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const initialFilter = params.get('debt') === '1' ? 'debt' : 'all';

  const invoiceStore = useInvoiceStore();
  const paymentStore = usePaymentStore();
  const { items: invoices } = invoiceStore;
  const { items: payments } = paymentStore;
  const { items: customers } = useCustomerStore();
  const { items: products } = useProductStore();
  const { settings } = useSettingsStore();

  const [filterMode, setFilterMode] = useState(initialFilter);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState(null);

  const paymentsByInvoice = useMemo(() => {
    const map = {};
    payments.forEach((payment) => {
      map[payment.invoiceId] = (map[payment.invoiceId] || 0) + Number(payment.amount || 0);
    });
    return map;
  }, [payments]);

  const todayKey = dayjs().format('YYYY-MM-DD');

  const rows = useMemo(() => {
    const sorted = [...invoices].sort((a, b) => new Date(b.date) - new Date(a.date));
    return sorted
      .filter((invoice) => dayjs(invoice.date).format('YYYY-MM-DD') === todayKey)
      .map((invoice) => {
        const customer = customers.find((c) => c.id === invoice.customerId);
        const paid = paymentsByInvoice[invoice.id] || 0;
        const itemsCount = invoice.items?.length || 0;
        const qtySum = (invoice.items || []).reduce(
          (sum, item) => sum + Number(item.qty || 0),
          0
        );

        const oldDebt = sorted
          .filter(
            (inv) =>
              inv.customerId === invoice.customerId &&
              dayjs(inv.date).isBefore(dayjs(invoice.date))
          )
          .reduce((sum, inv) => {
            const invPaid = paymentsByInvoice[inv.id] || 0;
            return sum + (Number(inv.total || 0) - invPaid);
          }, 0);

        const totalPay = Number(invoice.total || 0) + oldDebt;
        const remain = totalPay - paid;

        return {
          id: invoice.id,
          code: invoice.code,
          date: invoice.date,
          staff: 'admin',
          itemsCount,
          qtySum,
          amount: Number(invoice.total || 0),
          oldDebt,
          totalPay,
          paid,
          remain,
          customerName: customer?.name || '',
          phone: customer?.phone || '',
          address: customer?.address || '',
          note: invoice.note || '',
          status: invoice.paymentStatus,
        };
      })
      .filter((row) => (filterMode === 'debt' ? row.remain > 0 : true));
  }, [invoices, customers, paymentsByInvoice, filterMode, todayKey]);

  const selectedInvoice = useMemo(
    () => invoices.find((inv) => inv.id === selectedInvoiceId) || null,
    [invoices, selectedInvoiceId]
  );

  const selectedCustomer = useMemo(() => {
    if (!selectedInvoice) return null;
    return customers.find((c) => c.id === selectedInvoice.customerId) || null;
  }, [customers, selectedInvoice]);

  const selectedPayments = useMemo(() => {
    if (!selectedInvoiceId) return [];
    return payments.filter((payment) => payment.invoiceId === selectedInvoiceId);
  }, [payments, selectedInvoiceId]);

  const selectedItems = useMemo(() => {
    if (!selectedInvoice) return [];
    return (selectedInvoice.items || []).map((item, index) => {
      const product = products.find((p) => p.id === item.productId);
      const qty = Number(item.qty || 0);
      const unitPrice = Number(item.unitPrice || 0);
      const lineTotal = Number(item.lineTotal || qty * unitPrice);
      return {
        key: `${selectedInvoice.id}-${index}`,
        name: product?.name || 'Sản phẩm',
        unit: product?.unit || '',
        spec: product?.spec || '',
        qty,
        unitPrice,
        lineTotal,
        note: item.lineNote || '',
      };
    });
  }, [selectedInvoice, products]);

  const previewHtml = useMemo(() => {
    if (!selectedInvoice || !settings) return '';
    return renderInvoiceTemplate({
      template: settings.invoiceTemplateHtml,
      invoice: selectedInvoice,
      customer: selectedCustomer || { name: 'Khách lẻ' },
      payments: selectedPayments,
      products,
      settings,
    });
  }, [selectedInvoice, selectedCustomer, selectedPayments, products, settings]);

  const handlePrint = () => {
    if (!previewHtml) return;
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    printWindow.document.write(previewHtml);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };

  const handleExport = () => {
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
    XLSX.writeFile(workbook, `${selectedInvoice.code || 'hoa-don'}.xlsx`);
  };

  const handleDelete = () => {
    if (!selectedInvoice) return;
    Modal.confirm({
      title: 'Xóa hóa đơn?',
      content: 'Thao tác này không thể hoàn tác.',
      okText: 'Xóa',
      cancelText: 'Hủy',
      onOk: async () => {
        const relatedPayments = payments.filter((p) => p.invoiceId === selectedInvoice.id);
        await Promise.all(relatedPayments.map((payment) => paymentStore.remove(payment.id)));
        await invoiceStore.remove(selectedInvoice.id);
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
          <Button size="large">Lịch sử sửa xóa</Button>
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
            {rows.map((row) => (
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
                <td className={row.paid > 0 ? 'text-success' : ''}>{formatMoney(row.paid)}</td>
                <td className={row.remain > 0 ? 'text-danger' : 'text-success'}>{formatMoney(row.remain)}</td>
                <td>{row.customerName}</td>
                <td>{row.phone}</td>
                <td>{row.address}</td>
                <td>{row.note}</td>
              </tr>
            ))}
            {!rows.length && (
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
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16 }}>
              <div>HĐ: <strong>{selectedInvoice.code}</strong></div>
              <div>KH: <strong>{selectedCustomer?.name || 'Khách lẻ'}</strong></div>
              <div>Tổng tiền: <strong>{formatMoney(selectedInvoice.total || 0)}</strong></div>
            </div>
            <div className="pos-table" style={{ marginTop: 12 }}>
              <table>
                <thead>
                  <tr>
                    <th>Tên hàng</th>
                    <th>ĐVT</th>
                    <th>Quy cách</th>
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
                      <td>{item.spec}</td>
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
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 16, gap: 12 }}>
              <Button danger size="large" onClick={handleDelete}>XÓA</Button>
              <Button size="large" onClick={handleEdit}>SỬA</Button>
              <Button size="large" type="primary" className="btn-primary" onClick={handlePrint}>
                IN LẠI
              </Button>
              <Button size="large" onClick={handleExport}>Xuất File...</Button>
              <Button size="large" onClick={() => setSelectedInvoiceId(null)}>THOÁT</Button>
            </div>
            <div style={{ marginTop: 12, color: '#b91c1c', fontSize: 12 }}>
              * Chức năng SỬA, XÓA hóa đơn chỉ dành cho Khách lẻ, nếu khách có công nợ, chỉ áp dụng cho hóa đơn gần đây nhất.
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default SalesRecent;
