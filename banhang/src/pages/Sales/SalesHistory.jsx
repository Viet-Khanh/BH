import { useEffect, useState } from 'react';
import { Button, Modal, Select, message } from 'antd';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import DateRangeFilter from '../../components/DateRangeFilter.jsx';
import { apiRequest } from '../../db/repository.js';
import { formatMoney } from '../../utils/moneyFormat.js';

const SalesHistory = () => {
  const navigate = useNavigate();
  const [range, setRange] = useState(() => [
    dayjs().startOf('day').toISOString(),
    dayjs().endOf('day').toISOString(),
  ]);
  const [rows, setRows] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [customerId, setCustomerId] = useState('');
  const [selectedInvoiceId, setSelectedInvoiceId] = useState(null);
  const [selectedInvoiceData, setSelectedInvoiceData] = useState(null);
  const [loadingPreview, setLoadingPreview] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const loadHistory = async () => {
      const params = new URLSearchParams();
      if (range[0]) params.set('from', range[0]);
      if (range[1]) params.set('to', range[1]);
      if (customerId) params.set('customerId', customerId);
      const query = params.toString();
      try {
        const data = await apiRequest(
          `/reports/invoice-history${query ? `?${query}` : ''}`
        );
        if (!cancelled) {
          setRows(Array.isArray(data?.rows) ? data.rows : []);
          setCustomers(Array.isArray(data?.customers) ? data.customers : []);
        }
      } catch (error) {
        if (!cancelled) {
          message.error('Không thể tải lịch sử sửa/xóa.');
        }
      }
    };

    loadHistory();
    return () => {
      cancelled = true;
    };
  }, [range, customerId]);

  useEffect(() => {
    if (!selectedInvoiceId) {
      setSelectedInvoiceData(null);
      setLoadingPreview(false);
      return;
    }

    let cancelled = false;
    const loadInvoicePreview = async () => {
      setLoadingPreview(true);
      try {
        const data = await apiRequest(
          `/reports/invoices/${selectedInvoiceId}/preview`
        );
        if (!cancelled) {
          setSelectedInvoiceData(data || null);
        }
      } catch (error) {
        if (!cancelled) {
          message.error('Không thể tải chi tiết hóa đơn đã xóa.');
          setSelectedInvoiceData(null);
        }
      } finally {
        if (!cancelled) {
          setLoadingPreview(false);
        }
      }
    };

    loadInvoicePreview();
    return () => {
      cancelled = true;
    };
  }, [selectedInvoiceId]);

  const selectedInvoice = selectedInvoiceData?.invoice || null;
  const selectedCustomer = selectedInvoiceData?.customer || null;
  const selectedItems = selectedInvoiceData?.items || [];
  const selectedPayments = selectedInvoiceData?.payments || [];
  const selectedPaid = selectedPayments.reduce(
    (sum, payment) => sum + Number(payment.amount || 0),
    0
  );
  const selectedRemain = Number(selectedInvoice?.total || 0) - selectedPaid;

  return (
    <div className="page-card pos-shell">
      <div className="pos-header recent-header">
        <Button size="large" onClick={() => navigate('/sales/recent')}>
          Quay lại
        </Button>
        <div className="pos-header-title">LỊCH SỬ SỬA/XÓA HÓA ĐƠN</div>
        <div className="pos-header-actions">
          <Button size="large" onClick={() => navigate('/sales')}>
            Bán hàng
          </Button>
        </div>
      </div>

      <div className="recent-filter">
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 16,
            marginBottom: '10px',
          }}
        >
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 4,
              minWidth: 320,
            }}
          >
            <span style={{ fontWeight: 600 }}>Theo ngày</span>
            <DateRangeFilter value={range} onChange={setRange} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <span style={{ fontWeight: 600 }}>Khách hàng</span>
            <Select
              allowClear
              size="large"
              placeholder="Chọn khách hàng"
              value={customerId || undefined}
              onChange={(value) => setCustomerId(value || '')}
              options={customers.map((item) => ({
                value: item.id,
                label: item.name,
              }))}
              style={{ minWidth: 220 }}
            />
          </div>
        </div>
      </div>

      <div className="pos-table">
        <table>
          <thead>
            <tr>
              <th>Thời gian</th>
              <th>Loại</th>
              <th>Số HĐ</th>
              <th>Ngày HĐ</th>
              <th>Nhân viên</th>
              <th>Khách hàng</th>
              <th>Tổng tiền</th>
              <th>Ghi chú</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const actionLabel = row.action === 'delete' ? 'Xóa' : 'Sửa';
              const actionClass =
                row.action === 'delete' ? 'text-danger' : 'text-success';
              const canPreview = row.action === 'delete';
              return (
                <tr
                  key={row.id}
                  onClick={
                    canPreview
                      ? () => setSelectedInvoiceId(row.invoiceId)
                      : undefined
                  }
                  style={canPreview ? { cursor: 'pointer' } : undefined}
                >
                  <td>
                    {row.date ? dayjs(row.date).format('DD/MM/YY HH:mm') : ''}
                  </td>
                  <td className={actionClass}>{actionLabel}</td>
                  <td>{row.code}</td>
                  <td>
                    {row.invoiceDate
                      ? dayjs(row.invoiceDate).format('DD/MM/YY HH:mm')
                      : ''}
                  </td>
                  <td>{row.staff}</td>
                  <td>{row.customerName}</td>
                  <td>{formatMoney(row.total)}</td>
                  <td>{row.note}</td>
                </tr>
              );
            })}
            {!rows.length && (
              <tr>
                <td colSpan={8} style={{ textAlign: 'center' }}>
                  Chưa có lịch sử.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Modal
        title="XEM THÔNG TIN HÓA ĐƠN ĐÃ XÓA"
        open={!!selectedInvoiceId}
        onCancel={() => setSelectedInvoiceId(null)}
        footer={null}
        width={900}
      >
        {loadingPreview && <div>Đang tải chi tiết...</div>}

        {!loadingPreview && !selectedInvoice && (
          <div>Không có dữ liệu hóa đơn.</div>
        )}

        {!loadingPreview && selectedInvoice && (
          <div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                gap: 16,
              }}
            >
              <div>
                HĐ: <strong>{selectedInvoice.code || ''}</strong>
              </div>
              <div>
                Ngày:{' '}
                <strong>
                  {selectedInvoice.date
                    ? dayjs(selectedInvoice.date).format('DD/MM/YY HH:mm')
                    : ''}
                </strong>
              </div>
              <div>
                KH: <strong>{selectedCustomer?.name || 'Khách lẻ'}</strong>
              </div>
            </div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                gap: 16,
                marginTop: 8,
              }}
            >
              <div>
                Tổng tiền:{' '}
                <strong>{formatMoney(selectedInvoice.total || 0)}</strong>
              </div>
              <div>
                Đã thu: <strong>{formatMoney(selectedPaid)}</strong>
              </div>
              <div>
                Còn nợ: <strong>{formatMoney(selectedRemain)}</strong>
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
                      <td colSpan={6} style={{ textAlign: 'center' }}>
                        Không có hàng hóa.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default SalesHistory;
