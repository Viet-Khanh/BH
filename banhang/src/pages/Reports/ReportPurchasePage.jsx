import { Button, Tabs } from 'antd';
import { lazy, Suspense } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

const ReportPurchaseInvoicesTab = lazy(
  () => import('./ReportPurchaseInvoicesTab.jsx')
);
const ReportPurchaseDetailsTab = lazy(
  () => import('./ReportPurchaseDetailsTab.jsx')
);
const ReportPurchaseDebtTab = lazy(() => import('./ReportPurchaseDebtTab.jsx'));

const TAB_KEYS = new Set([
  'purchase-debt',
  'purchase-invoices',
  'purchase-details',
]);

const ReportPurchasePage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const tabFallback = <div style={{ padding: 16 }}>Đang tải...</div>;
  const params = new URLSearchParams(location.search);
  const rawTab = params.get('tab') || 'purchase-debt';
  const activeTab = TAB_KEYS.has(rawTab) ? rawTab : 'purchase-debt';

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
      <div className="page-title">Báo cáo nhập hàng</div>
      <div className="action-row">
        <Button size="large" onClick={() => navigate('/')}>
          Quay lại
        </Button>
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
            key: 'purchase-debt',
            label: 'Công nợ',
            children: (
              <Suspense fallback={tabFallback}>
                <ReportPurchaseDebtTab />
              </Suspense>
            ),
          },
          {
            key: 'purchase-invoices',
            label: 'Hoá đơn nhập hàng',
            children: (
              <Suspense fallback={tabFallback}>
                <ReportPurchaseInvoicesTab />
              </Suspense>
            ),
          },
          {
            key: 'purchase-details',
            label: 'Chi tiết nhập hàng',
            children: (
              <Suspense fallback={tabFallback}>
                <ReportPurchaseDetailsTab />
              </Suspense>
            ),
          },
        ]}
      />
    </div>
  );
};

export default ReportPurchasePage;
