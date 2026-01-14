import { useEffect, useState } from 'react';
import { Button, Select, message } from 'antd';
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

  useEffect(() => {
    let cancelled = false;
    const loadHistory = async () => {
      const params = new URLSearchParams();
      if (range[0]) params.set('from', range[0]);
      if (range[1]) params.set('to', range[1]);
      if (customerId) params.set('customerId', customerId);
      const query = params.toString();
      try {
        const data = await apiRequest(`/reports/invoice-history${query ? `?${query}` : ''}`);
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
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16 , marginBottom : '10px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 320 }}>
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
              const actionClass = row.action === 'delete' ? 'text-danger' : 'text-success';
              return (
                <tr key={row.id}>
                  <td>{row.date ? dayjs(row.date).format('DD/MM/YY HH:mm') : ''}</td>
                  <td className={actionClass}>{actionLabel}</td>
                  <td>{row.code}</td>
                  <td>{row.invoiceDate ? dayjs(row.invoiceDate).format('DD/MM/YY HH:mm') : ''}</td>
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
    </div>
  );
};

export default SalesHistory;
