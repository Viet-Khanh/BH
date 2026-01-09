import { useEffect } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { Layout, Button, Space } from 'antd';
import Home from './pages/Home.jsx';
import System from './pages/System/System.jsx';
import Catalog from './pages/Catalog/Catalog.jsx';
import Sales from './pages/Sales/Sales.jsx';
import SalesRecent from './pages/Sales/SalesRecent.jsx';
import Purchases from './pages/Purchases/Purchases.jsx';
import Cashbook from './pages/Cashbook/Cashbook.jsx';
import Reports from './pages/Reports/Reports.jsx';
import { useSettingsStore } from './store/settingsStore.js';
import { useProductStore } from './store/productStore.js';
import { useCustomerStore } from './store/customerStore.js';
import { useSupplierStore } from './store/supplierStore.js';
import { useUnitStore } from './store/unitStore.js';
import { usePurchaseStore } from './store/purchaseStore.js';
import { useInvoiceStore } from './store/invoiceStore.js';
import { usePaymentStore } from './store/paymentStore.js';
import { useCashbookStore } from './store/cashbookStore.js';

const { Header, Content } = Layout;

const App = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { ensureDefaults, load: loadSettings } = useSettingsStore();
  const { load: loadProducts } = useProductStore();
  const { load: loadCustomers, ensureDefaultCustomer } = useCustomerStore();
  const { load: loadSuppliers } = useSupplierStore();
  const { load: loadUnits } = useUnitStore();
  const { load: loadPurchases } = usePurchaseStore();
  const { load: loadInvoices } = useInvoiceStore();
  const { load: loadPayments } = usePaymentStore();
  const { load: loadCashbook } = useCashbookStore();

  useEffect(() => {
    const boot = async () => {
      await ensureDefaults();
      await loadSettings();
      await Promise.all([
        loadProducts(),
        loadCustomers(),
        loadSuppliers(),
        loadUnits(),
        loadPurchases(),
        loadInvoices(),
        loadPayments(),
        loadCashbook(),
      ]);
      await ensureDefaultCustomer();
    };

    boot();
  }, [
    ensureDefaults,
    loadSettings,
    loadProducts,
    loadCustomers,
    loadSuppliers,
    loadUnits,
    loadPurchases,
    loadInvoices,
    loadPayments,
    loadCashbook,
    ensureDefaultCustomer,
  ]);

  const showBack = location.pathname !== '/';

  return (
    <Layout className="app-shell">
      <Header className="app-header">
        <div className="app-title">PHẦN MỀM BÁN HÀNG NHÔM KÍNH/SẮT</div>
        <Space>
          {showBack && (
            <Button size="large" onClick={() => navigate('/')}
              className="btn-secondary">
              Trang chủ
            </Button>
          )}
        </Space>
      </Header>
      <Content className="app-content">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/system" element={<System />} />
          <Route path="/catalog" element={<Catalog />} />
          <Route path="/sales" element={<Sales />} />
          <Route path="/sales/recent" element={<SalesRecent />} />
          <Route path="/purchases" element={<Purchases />} />
          <Route path="/cashbook" element={<Cashbook />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="*" element={<Home />} />
        </Routes>
      </Content>
    </Layout>
  );
};

export default App;
