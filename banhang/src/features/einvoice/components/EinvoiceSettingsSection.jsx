import { Button, Form, Input, message, Radio, Select, Switch } from 'antd';
import { useEffect } from 'react';
import { useSettingsStore } from '../../../store/settingsStore.js';
import {
  EINVOICE_DEFAULT_SETTINGS,
  TAX_METHOD_OPTIONS,
} from '../domain/settingsDefaults.js';
import { VAT_RATE_OPTIONS } from '../domain/vatRates.js';
import { PROFILES } from '../profiles/index.js';

const FIELDS = Object.keys(EINVOICE_DEFAULT_SETTINGS);
const PROFILE_OPTIONS = PROFILES.map(({ id, name }) => ({
  value: id,
  label: name,
}));
const pickFields = (settings) =>
  Object.fromEntries(FIELDS.map((field) => [field, settings[field]]));

// "Hoá đơn điện tử" section of the System page; owns its form.
const EinvoiceSettingsSection = () => {
  const { settings, update } = useSettingsStore();
  const [form] = Form.useForm();
  const taxMethod = Form.useWatch('taxMethod', form);

  useEffect(() => {
    form.setFieldsValue(pickFields(settings));
  }, [form, settings]);

  const save = async () => {
    const values = await form.validateFields();
    await update({
      ...values,
      sellerTaxCode: values.sellerTaxCode?.trim() || '',
    });
    message.success('Đã lưu cài đặt hoá đơn điện tử.');
  };

  return (
    <>
      <div className="section-title">Hoá đơn điện tử</div>
      <Form form={form} layout="vertical" style={{ maxWidth: 640 }}>
        <Form.Item label="Loại hình" name="taxMethod">
          <Radio.Group options={TAX_METHOD_OPTIONS} />
        </Form.Item>
        <Form.Item label="Mã số thuế người bán" name="sellerTaxCode">
          <Input placeholder="Bắt buộc để xuất file hoá đơn điện tử" />
        </Form.Item>
        <Form.Item
          label="Mã địa điểm kinh doanh"
          name="businessLocationCode"
          extra="Hộ kinh doanh có nhiều cửa hàng dùng chung mã số thuế phải ghi mã địa điểm."
        >
          <Input />
        </Form.Item>
        {taxMethod === 'deduction' && (
          <>
            <Form.Item
              label="Giá bán đã gồm thuế GTGT"
              name="pricesIncludeVat"
              valuePropName="checked"
            >
              <Switch />
            </Form.Item>
            <Form.Item label="Thuế suất mặc định" name="defaultVatRate">
              <Select options={VAT_RATE_OPTIONS} />
            </Form.Item>
          </>
        )}
        <Form.Item label="Mẫu file mặc định" name="einvoiceProfile">
          <Select options={PROFILE_OPTIONS} />
        </Form.Item>
        <Button type="primary" onClick={save}>
          Lưu cài đặt hoá đơn điện tử
        </Button>
      </Form>
    </>
  );
};

export default EinvoiceSettingsSection;
