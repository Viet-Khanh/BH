import { lazy, Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Tabs } from 'antd';

const ReportStockTab = lazy(() => import('./ReportStockTab.jsx'));
const ReportStockMovementTab = lazy(() => import('./ReportStockMovementTab.jsx'));

const ReportStockPage = () => {
  const navigate = useNavigate();
  const tabFallback = <div style={{ padding: 16 }}>Đang tải...</div>;
  return (
    <div className="page-card">
      <div className="page-title">Báo cáo kho</div>
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
            key: 'stock',
            label: 'Tồn kho',
            children: (
              <Suspense fallback={tabFallback}>
                <ReportStockTab />
              </Suspense>
            ),
          },
          {
            key: 'stock-movement',
            label: 'Nhập xuất tồn kho',
            children: (
              <Suspense fallback={tabFallback}>
                <ReportStockMovementTab />
              </Suspense>
            ),
          },
        ]}
      />
    </div>
  );
};

export default ReportStockPage;
