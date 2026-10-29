import { Form, Input } from 'antd';
import BankSettingsFields from '../../../features/printing/components/BankSettingsFields.jsx';
import {
  fromBankFormValues,
  toBankFormValues,
} from '../../../features/printing/domain/bankSettingsForm.js';
import SettingsFormSection from './SettingsFormSection.jsx';

const SHOP_NAMES = ['shopName', 'shopPhone', 'shopAddress'];
const NAMES = [...SHOP_NAMES, 'bankBin', 'bankAccountNo', 'bankAccountName'];

const pickShop = (source) =>
  Object.fromEntries(SHOP_NAMES.map((name) => [name, source?.[name]]));

const toValues = (settings) => ({
  ...pickShop(settings),
  ...toBankFormValues(settings),
});

const fromValues = (values) => ({
  ...pickShop(values),
  ...fromBankFormValues(values),
});

// "Cửa hàng": shop name, phone, address and the bank account for VietQR receipts.
const ShopGroup = () => (
  <SettingsFormSection
    names={NAMES}
    toValues={toValues}
    fromValues={fromValues}
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
    <BankSettingsFields />
  </SettingsFormSection>
);

export default ShopGroup;
