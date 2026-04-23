import { Alert, Button, Skeleton } from 'antd';
import dayjs from 'dayjs';
import { useNavigate } from 'react-router-dom';
import { formatMoney } from '../../../utils/moneyFormat.js';
import { useTodayDashboard } from '../hooks/useTodayDashboard.js';
import DashboardSummaryCard from './DashboardSummaryCard.jsx';
import './TodayDashboard.css';

const asNumber = (value) => Number(value || 0);

const CustomerDebtRow = (customer, index) => (
  <div className="today-dashboard-row">
    <span>
      {index + 1}. {customer.name || 'Khách hàng'}
      {customer.phone ? <small> · {customer.phone}</small> : null}
    </span>
    <strong>{formatMoney(customer.debt)}</strong>
  </div>
);

const LowStockRow = (product) => (
  <div className="today-dashboard-row">
    <span>
      {product.name || 'Sản phẩm'}
      {product.code ? <small> · {product.code}</small> : null}
    </span>
    <strong>
      {asNumber(product.stock)} {product.unit || ''}
    </strong>
  </div>
);

const TodayDashboard = ({ showShortcuts = true }) => {
  const navigate = useNavigate();
  const { data, loading, error, refresh } = useTodayDashboard();

  const sales = data?.salesToday || {};
  const debt = data?.debt || {};
  const stock = data?.stock || {};
  const generatedAt = data?.generatedAt
    ? dayjs(data.generatedAt).format('HH:mm DD/MM/YYYY')
    : '';

  const salesMetrics = [
    { label: 'Doanh thu', value: formatMoney(sales.amount), tone: 'primary' },
    { label: 'Số hóa đơn', value: asNumber(sales.invoiceCount) },
    { label: 'Đã thu', value: formatMoney(sales.paid), tone: 'success' },
    { label: 'Ghi nợ', value: formatMoney(sales.remain), tone: 'danger' },
  ];
  const debtMetrics = [
    { label: 'Tổng nợ', value: formatMoney(debt.totalDebt), tone: 'danger' },
    { label: 'Khách còn nợ', value: asNumber(debt.debtorCount) },
  ];
  const stockMetrics = [
    { label: 'Mặt hàng cảnh báo', value: asNumber(stock.lowStockCount) },
    { label: 'Ngưỡng tồn', value: asNumber(stock.threshold) },
  ];

  return (
    <section className="today-dashboard">
      <div className="today-dashboard-header">
        <div>
          <h2>Dashboard hôm nay</h2>
          <p>
            Theo dõi nhanh bán hàng, công nợ và tồn kho cần xử lý trong ngày.
          </p>
          {generatedAt && <small>Cập nhật: {generatedAt}</small>}
        </div>
        <Button onClick={refresh} disabled={loading}>
          Làm mới
        </Button>
      </div>

      {error && (
        <Alert
          type="warning"
          showIcon
          message={error}
          style={{ marginBottom: 12 }}
        />
      )}

      {loading && !data ? (
        <Skeleton active paragraph={{ rows: 6 }} />
      ) : (
        <>
          <div className="today-dashboard-grid">
            <DashboardSummaryCard
              title="Bán hàng hôm nay"
              metrics={salesMetrics}
            />
            <DashboardSummaryCard
              title="Công nợ khách hiện tại"
              metrics={debtMetrics}
              items={debt.topCustomers || []}
              emptyText="Chưa có khách nợ."
              renderItem={CustomerDebtRow}
            />
            <DashboardSummaryCard
              title="Cảnh báo kho hiện tại"
              metrics={stockMetrics}
              items={stock.topProducts || []}
              emptyText="Không có hàng dưới ngưỡng."
              renderItem={LowStockRow}
            />
          </div>
          {showShortcuts ? (
            <div className="today-dashboard-shortcuts">
              <Button type="primary" onClick={() => navigate('/sales')}>
                Bán hàng
              </Button>
              <Button onClick={() => navigate('/reports?tab=debt')}>
                Thu nợ
              </Button>
              <Button onClick={() => navigate('/purchases')}>Nhập hàng</Button>
              <Button onClick={() => navigate('/reports?tab=sales')}>
                Xem báo cáo
              </Button>
            </div>
          ) : null}
        </>
      )}
    </section>
  );
};

export default TodayDashboard;
