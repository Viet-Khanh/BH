import { Form, Input } from 'antd';
import SettingsFormSection from './SettingsFormSection.jsx';

const NAMES = ['shopName', 'shopPhone', 'shopAddress'];

// "Cửa hàng": shop name, phone and address.
const ShopGroup = () => (
  <SettingsFormSection
    names={NAMES}
    successMessage="Đã lưu thông tin cửa hàng."
  >
    <Form.Item label="Tên shop" name="shopName" rules={[{ required: true }]}>
      <Input size="large" />
    </Form.Item>
    <Form.Item label="Số điện thoại" name="shopPhone">
      <Input size="large" />
    </Form.Item>
    <Form.Item label="Địa chỉ" name="shopAddress">
      <Input size="large" />
    </Form.Item>
  </SettingsFormSection>
);

export default ShopGroup;
