import { Button, Layout, Space } from 'antd';
import { Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import Cashbook from './pages/Cashbook/Cashbook.jsx';
import Catalog from './pages/Catalog/Catalog.jsx';
import DashboardPage from './pages/Dashboard/DashboardPage.jsx';
import Home from './pages/Home.jsx';
import Purchases from './pages/Purchases/Purchases.jsx';
import ReportPurchasePage from './pages/Reports/ReportPurchasePage.jsx';
import Reports from './pages/Reports/Reports.jsx';
import ReportStockPage from './pages/Reports/ReportStockPage.jsx';
import Sales from './pages/Sales/Sales.jsx';
import SalesHistory from './pages/Sales/SalesHistory.jsx';
import SalesRecent from './pages/Sales/SalesRecent.jsx';
import System from './pages/System/System.jsx';

const { Header, Content } = Layout;

const App = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const showBack = location.pathname !== '/';

  return (
    <Layout className="app-shell">
      <Header className="app-header">
        <div className="app-title">PHẦN MỀM BÁN HÀNG NHÔM KÍNH/SẮT</div>
        <Space>
          {showBack && (
            <Button
              size="large"
              onClick={() => navigate('/')}
              className="btn-secondary"
            >
              Trang chủ
            </Button>
          )}
        </Space>
      </Header>
      <Content className="app-content">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/system" element={<System />} />
          <Route path="/catalog" element={<Catalog />} />
          <Route path="/sales" element={<Sales />} />
          <Route path="/sales/recent" element={<SalesRecent />} />
          <Route path="/sales/history" element={<SalesHistory />} />
          <Route path="/purchases" element={<Purchases />} />
          <Route path="/cashbook" element={<Cashbook />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/report-purchase" element={<ReportPurchasePage />} />
          <Route path="/report-stock" element={<ReportStockPage />} />
          <Route path="*" element={<Home />} />
        </Routes>
      </Content>
    </Layout>
  );
};

export default App;
