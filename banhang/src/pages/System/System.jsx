import { useEffect } from 'react';
import { Button, Form, Input, InputNumber, Modal, Switch, message } from 'antd';
import { useNavigate } from 'react-router-dom';
import { useSettingsStore } from '../../store/settingsStore.js';
import { useProductStore } from '../../store/productStore.js';
import { useCustomerStore } from '../../store/customerStore.js';
import { useSupplierStore } from '../../store/supplierStore.js';
import { useUnitStore } from '../../store/unitStore.js';
import { usePurchaseStore } from '../../store/purchaseStore.js';
import { useInvoiceStore } from '../../store/invoiceStore.js';
import { usePaymentStore } from '../../store/paymentStore.js';
import { useCashbookStore } from '../../store/cashbookStore.js';
import { seedDemo } from '../../db/seed.js';
import TemplateEditor from '../../components/TemplateEditor.jsx';
import DataUpgradePanel from '../../features/dataUpgrade/components/DataUpgradePanel.jsx';
import { consumeSystemAccess } from './systemAccess.js';
import { getSystemPasswordFromSettings } from './systemPassword.js';

const System = () => {
  const navigate = useNavigate();
  const {
    settings,
    update: updateSettings,
    load: loadSettings,
  } = useSettingsStore();
  const { items: products, load: loadProducts } = useProductStore();
  const {
    items: customers,
    load: loadCustomers,
    ensureDefaultCustomer,
  } = useCustomerStore();
  const { load: loadSuppliers } = useSupplierStore();
  const { load: loadUnits } = useUnitStore();
  const { load: loadPurchases } = usePurchaseStore();
  const { load: loadInvoices } = useInvoiceStore();
  const { load: loadPayments } = usePaymentStore();
  const { load: loadCashbook } = useCashbookStore();
  const [form] = Form.useForm();

  useEffect(() => {
    const bootstrap = async () => {
      if (!consumeSystemAccess()) {
        message.error('Vui lòng nhập mật khẩu từ Trang chủ để vào Hệ thống.');
        navigate('/', { replace: true });
        return;
      }
      await Promise.all([loadSettings(), loadProducts(), loadCustomers()]);
    };
    bootstrap();
  }, [loadCustomers, loadProducts, loadSettings, navigate]);

  useEffect(() => {
    form.setFieldsValue({
      ...settings,
      systemPassword: getSystemPasswordFromSettings(settings),
    });
  }, [form, settings]);

  const reloadAll = async () => {
    await Promise.all([
      loadSettings(),
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

  const handleSave = async () => {
    const values = await form.validateFields();
    await updateSettings(values);
    message.success('Đã lưu hệ thống.');
  };

  const handleSeed = () => {
    Modal.confirm({
      title: 'Nạp dữ liệu mẫu?',
      content: 'Dữ liệu hiện tại sẽ bị thay thế.',
      okText: 'Nạp',
      cancelText: 'Hủy',
      onOk: async () => {
        await seedDemo();
        await reloadAll();
        message.success('Đã nạp dữ liệu mẫu.');
      },
    });
  };

  return (
    <div className="page-card">
      <div className="page-title">Hệ thống</div>
      <div className="action-row">
        <Button size="large" onClick={() => navigate('/')}>
          Quay lại
        </Button>
        <Button
          size="large"
          type="primary"
          className="btn-primary"
          onClick={handleSave}
        >
          Lưu
        </Button>
      </div>

      <Form form={form} layout="vertical">
        <div className="form-grid">
          <Form.Item
            label="Tên shop"
            name="shopName"
            rules={[{ required: true }]}
          >
            <Input size="large" />
          </Form.Item>
          <Form.Item label="Số điện thoại" name="shopPhone">
            <Input size="large" />
          </Form.Item>
          <Form.Item label="Địa chỉ" name="shopAddress">
            <Input size="large" />
          </Form.Item>
          <Form.Item
            label="Cho phép âm kho"
            name="allowNegativeStock"
            valuePropName="checked"
          >
            <Switch />
          </Form.Item>
          <Form.Item
            label="Cho phép hiển thị thông tin nhạy cảm"
            name="showSensitiveInfo"
            valuePropName="checked"
          >
            <Switch />
          </Form.Item>
          <Form.Item label="Ngưỡng cảnh báo tồn thấp" name="lowStockThreshold">
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item label="Số bản in" name="printCopies">
            <InputNumber min={1} precision={0} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item
            label="Mật khẩu vào trang hệ thống"
            name="systemPassword"
            rules={[{ required: true, message: 'Vui lòng nhập mật khẩu.' }]}
          >
            <Input.Password size="large" autoComplete="new-password" />
          </Form.Item>
        </div>
      </Form>

      <div className="section-title">Mẫu hóa đơn</div>
      <TemplateEditor
        settings={settings}
        products={products}
        customers={customers}
        showShopFields={false}
        onSave={async (values) => {
          await updateSettings(values);
          message.success('Đã lưu mẫu hóa đơn.');
        }}
      />

      <div className="section-title">Tối ưu dữ liệu</div>
      <DataUpgradePanel onCommitted={reloadAll} />

      <div className="section-title">Dữ liệu mẫu</div>
      <div className="action-row">
        <Button size="large" onClick={handleSeed}>
          Nạp dữ liệu mẫu
        </Button>
      </div>
    </div>
  );
};

export default System;
