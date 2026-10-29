import { Form, Input } from 'antd';
import { getSystemPasswordFromSettings } from '../systemPassword.js';
import SettingsFormSection from './SettingsFormSection.jsx';

const NAMES = ['systemPassword'];

const toValues = (settings) => ({
  systemPassword: getSystemPasswordFromSettings(settings),
});

// "Bảo mật": password asked on the home page before opening this page.
const SecurityGroup = () => (
  <SettingsFormSection
    names={NAMES}
    toValues={toValues}
    successMessage="Đã lưu mật khẩu hệ thống."
  >
    <Form.Item
      label="Mật khẩu vào trang hệ thống"
      name="systemPassword"
      rules={[{ required: true, message: 'Vui lòng nhập mật khẩu.' }]}
    >
      <Input.Password size="large" autoComplete="new-password" />
    </Form.Item>
  </SettingsFormSection>
);

export default SecurityGroup;
