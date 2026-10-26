import { Form, Select } from 'antd';
import { useSettingsStore } from '../../../store/settingsStore.js';
import { VAT_RATE_OPTIONS } from '../domain/vatRates.js';

// VAT rate of a product; only meaningful for VAT invoices (company shops).
const ProductTaxField = () => {
  const { settings } = useSettingsStore();
  if (settings.taxMethod !== 'deduction') return null;
  return (
    <Form.Item
      label="Thuế suất GTGT"
      name="vatRate"
      extra={`Để trống = mặc định của cửa hàng (${settings.defaultVatRate}%).`}
    >
      <Select allowClear options={VAT_RATE_OPTIONS} placeholder="Mặc định" />
    </Form.Item>
  );
};

export default ProductTaxField;
