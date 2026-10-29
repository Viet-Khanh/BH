import { Form, Input, Select } from 'antd';
import {
  BANK_OPTIONS,
  BIN_PATTERN,
  filterBankOption,
  OTHER_BANK,
} from '../domain/bankSettingsForm.js';

// Shop bank account for the VietQR block (System → Cửa hàng); form names from
// domain/bankSettingsForm.js (bankChoice + bankOtherBin ⇄ Settings.bankBin).
const BankSettingsFields = () => {
  const form = Form.useFormInstance();
  const bankChoice = Form.useWatch('bankChoice', form);

  return (
    <>
      <Form.Item
        label="Ngân hàng"
        name="bankChoice"
        extra="Dùng cho QR chuyển khoản trên hoá đơn cuộn."
      >
        <Select
          size="large"
          showSearch
          allowClear
          placeholder="Chọn ngân hàng"
          options={BANK_OPTIONS}
          filterOption={filterBankOption}
        />
      </Form.Item>
      {bankChoice === OTHER_BANK && (
        <Form.Item
          label="Mã BIN ngân hàng (6 số)"
          name="bankOtherBin"
          rules={[
            { required: true, message: 'Nhập mã BIN.' },
            { pattern: BIN_PATTERN, message: 'Mã BIN gồm 6 chữ số.' },
          ]}
        >
          <Input size="large" inputMode="numeric" maxLength={6} />
        </Form.Item>
      )}
      <Form.Item label="Số tài khoản" name="bankAccountNo">
        <Input size="large" />
      </Form.Item>
      <Form.Item label="Tên chủ tài khoản" name="bankAccountName">
        <Input size="large" />
      </Form.Item>
    </>
  );
};

export default BankSettingsFields;
