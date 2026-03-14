import { Button, Tabs } from 'antd';
import dayjs from 'dayjs';
import { lazy, Suspense, useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useSettingsStore } from '../../store/settingsStore.js';

const ReportDebtTab = lazy(() => import('./ReportDebtTab.jsx'));
const ReportProfitTab = lazy(() => import('./ReportProfitTab.jsx'));
const ReportStockOutTab = lazy(() => import('./ReportStockOutTab.jsx'));
const ReportSalesInvoicesTab = lazy(() => import('./ReportSalesInvoicesTab.jsx'));
const ReportSalesDetailsTab = lazy(() => import('./ReportSalesDetailsTab.jsx'));

const BASE_TAB_KEYS = new Set(['debt', 'sales', 'sales-detail', 'stock-out']);
const TAB_KEYS_WITH_PROFIT = new Set(['debt', 'sales', 'sales-detail', 'stock-out', 'profit']);

const Reports = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { settings, load: loadSettings } = useSettingsStore();
  const [profitRange, setProfitRange] = useState(() => {
    const end = dayjs().endOf('day');
    const start = end.subtract(30, 'day').startOf('day');
    return [start.toISOString(), end.toISOString()];
  });

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  const showSensitiveInfo = Boolean(settings?.showSensitiveInfo);
  const tabKeys = showSensitiveInfo ? TAB_KEYS_WITH_PROFIT : BASE_TAB_KEYS;
  const tabFallback = <div style={{ padding: 16 }}>Đang tải...</div>;
  const params = new URLSearchParams(location.search);
  const rawTab = params.get('tab') || 'debt';
  const activeTab = tabKeys.has(rawTab) ? rawTab : 'debt';

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
                <ReportSalesInvoicesTab showSensitiveInfo={showSensitiveInfo} />
              </Suspense>
            ),
          },
          {
            key: 'sales-detail',
            label: 'Chi tiết bán hàng',
            children: (
              <Suspense fallback={tabFallback}>
                <ReportSalesDetailsTab showSensitiveInfo={showSensitiveInfo} />
              </Suspense>
            ),
          },
          {
            key: 'stock-out',
            label: 'Báo cáo xuất kho',
            children: (
              <Suspense fallback={tabFallback}>
                <ReportStockOutTab showSensitiveInfo={showSensitiveInfo} />
              </Suspense>
            ),
          },
          ...(showSensitiveInfo
            ? [
                {
                  key: 'profit',
                  label: 'Doanh thu & Lãi',
                  children: (
                    <Suspense fallback={tabFallback}>
                      <ReportProfitTab range={profitRange} onRangeChange={setProfitRange} />
                    </Suspense>
                  ),
                },
              ]
            : []),
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
