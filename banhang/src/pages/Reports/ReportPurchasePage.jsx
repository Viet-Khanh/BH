import { Button, Tabs } from 'antd';
import { lazy, Suspense } from 'react';
import { useNavigate } from 'react-router-dom';

const ReportPurchaseInvoicesTab = lazy(() => import('./ReportPurchaseInvoicesTab.jsx'));
const ReportPurchaseDetailsTab = lazy(() => import('./ReportPurchaseDetailsTab.jsx'));
const ReportPurchaseDebtTab = lazy(() => import('./ReportPurchaseDebtTab.jsx'));

const ReportPurchasePage = () => {
  const navigate = useNavigate();
  const tabFallback = <div style={{ padding: 16 }}>Đang tải...</div>;

  return (
    <div className="page-card">
      <div className="page-title">Báo cáo nhập hàng</div>
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
          }
        ]}
      />
    </div>
  );
};

export default ReportPurchasePage;
