import { Button, Tabs } from 'antd';
import { lazy, Suspense, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const ReportDebtTab = lazy(() => import('./ReportDebtTab.jsx'));
const ReportProfitTab = lazy(() => import('./ReportProfitTab.jsx'));
const ReportCashTab = lazy(() => import('./ReportCashTab.jsx'));
const ReportSalesInvoicesTab = lazy(() => import('./ReportSalesInvoicesTab.jsx'));
const ReportSalesDetailsTab = lazy(() => import('./ReportSalesDetailsTab.jsx'));

const Reports = () => {
  const navigate = useNavigate();
  const [profitRange, setProfitRange] = useState([null, null]);
  const tabFallback = <div style={{ padding: 16 }}>Đang tải...</div>;

  return (
    <div className="page-card">
      <div className="page-title">Báo cáo</div>
      <div className="action-row">
        <Button size="large" onClick={() => navigate('/')}>Quay lại</Button>
      </div>

      <Tabs
        type="card"
        className="page-tabs"
        tabPosition="top"
        tabBarGutter={8}
        items={[
          {
            key: 'debt',
            label: 'Công nợ',
            children: (
              <Suspense fallback={tabFallback}>
                <ReportDebtTab />
              </Suspense>
            ),
          },
          {
            key: 'sales',
            label: 'Hoá đơn bán hàng',
            children: (
              <Suspense fallback={tabFallback}>
                <ReportSalesInvoicesTab />
              </Suspense>
            ),
          },
          {
            key: 'sales-detail',
            label: 'Chi tiết bán hàng',
            children: (
              <Suspense fallback={tabFallback}>
                <ReportSalesDetailsTab />
              </Suspense>
            ),
          },
          {
            key: 'profit',
            label: 'Doanh thu & Lãi',
            children: (
              <Suspense fallback={tabFallback}>
                <ReportProfitTab range={profitRange} onRangeChange={setProfitRange} />
              </Suspense>
            ),
          },
          {
            key: 'summary',
            label: 'Thu/Chi',
            children: (
              <Suspense fallback={tabFallback}>
                <ReportCashTab range={profitRange} onRangeChange={setProfitRange} />
              </Suspense>
            ),
          },
        ]}
      />
    </div>
  );
};

export default Reports;
