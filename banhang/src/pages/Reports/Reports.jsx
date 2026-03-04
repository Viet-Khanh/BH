import { Button, Tabs } from 'antd';
import dayjs from 'dayjs';
import { lazy, Suspense, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

const ReportDebtTab = lazy(() => import('./ReportDebtTab.jsx'));
const ReportProfitTab = lazy(() => import('./ReportProfitTab.jsx'));
const ReportStockOutTab = lazy(() => import('./ReportStockOutTab.jsx'));
const ReportCashTab = lazy(() => import('./ReportCashTab.jsx'));
const ReportSalesInvoicesTab = lazy(() => import('./ReportSalesInvoicesTab.jsx'));
const ReportSalesDetailsTab = lazy(() => import('./ReportSalesDetailsTab.jsx'));

const TAB_KEYS = new Set(['debt', 'sales', 'sales-detail', 'stock-out', 'profit']);

const Reports = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [profitRange, setProfitRange] = useState(() => {
    const end = dayjs().endOf('day');
    const start = end.subtract(30, 'day').startOf('day');
    return [start.toISOString(), end.toISOString()];
  });
  const tabFallback = <div style={{ padding: 16 }}>Đang tải...</div>;
  const params = new URLSearchParams(location.search);
  const rawTab = params.get('tab') || 'debt';
  const activeTab = TAB_KEYS.has(rawTab) ? rawTab : 'debt';

  const handleTabChange = (nextTab) => {
    const nextParams = new URLSearchParams(location.search);
    nextParams.set('tab', nextTab);
    const nextSearch = nextParams.toString();
    navigate(
      {
        pathname: location.pathname,
        search: nextSearch ? `?${nextSearch}` : '',
      },
      { replace: true }
    );
  };

  return (
    <div className="page-card">
      <div className="page-title">Báo cáo</div>
      <div className="action-row">
        <Button size="large" onClick={() => navigate('/')}>Quay lại</Button>
      </div>
      
      <Tabs
        activeKey={activeTab}
        onChange={handleTabChange}
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
            key: 'stock-out',
            label: 'Báo cáo xuất kho',
            children: (
              <Suspense fallback={tabFallback}>
                <ReportStockOutTab />
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
          // {
          //   key: 'summary',
          //   label: 'Thu/Chi',
          //   children: (
          //     <Suspense fallback={tabFallback}>
          //       <ReportCashTab range={profitRange} onRangeChange={setProfitRange} />
          //     </Suspense>
          //   ),
          // },
        ]}
      />
    </div>
  );
};

export default Reports;
