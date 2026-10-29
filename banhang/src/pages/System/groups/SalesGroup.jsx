import { Form, InputNumber, Switch } from 'antd';
import SettingsFormSection from './SettingsFormSection.jsx';

const NAMES = [
  'allowNegativeStock',
  'autoUpdateAvgCostOnPurchase',
  'lowStockThreshold',
  'showSensitiveInfo',
];

// "Bán hàng & kho": stock rules and sensitive info display.
const SalesGroup = () => (
  <SettingsFormSection
    names={NAMES}
    successMessage="Đã lưu cài đặt bán hàng & kho."
  >
    <Form.Item
      label="Cho phép âm kho"
      name="allowNegativeStock"
      valuePropName="checked"
    >
      <Switch />
    </Form.Item>
    <Form.Item
      label="Tự động cập nhật Giá vốn khi nhập hàng"
      name="autoUpdateAvgCostOnPurchase"
      valuePropName="checked"
    >
      <Switch />
    </Form.Item>
    <Form.Item label="Ngưỡng cảnh báo tồn thấp" name="lowStockThreshold">
      <InputNumber min={0} style={{ width: '100%' }} />
    </Form.Item>
    <Form.Item
      label="Cho phép hiển thị thông tin nhạy cảm"
      name="showSensitiveInfo"
      valuePropName="checked"
    >
      <Switch />
    </Form.Item>
  </SettingsFormSection>
);

export default SalesGroup;
