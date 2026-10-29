import { Button, Form, InputNumber, Select, Switch } from 'antd';
import { LABEL_PRESET_OPTIONS } from '../domain/printSettingsForm.js';
import PrinterSelectItem from './PrinterSelectItem.jsx';

const NUMBER_FIELDS = [
  { name: 'labelWidthMm', label: 'Rộng tem (mm)', min: 10, max: 120 },
  { name: 'labelHeightMm', label: 'Cao tem (mm)', min: 10, max: 120 },
  { name: 'labelColumns', label: 'Số tem mỗi hàng', min: 1, max: 4 },
  { name: 'labelGapMm', label: 'Khe giữa 2 tem (mm)', min: 0, max: 20 },
  { name: 'labelOffsetXMm', label: 'Lệch ngang (mm)', min: -10, max: 10 },
  { name: 'labelOffsetYMm', label: 'Lệch dọc (mm)', min: -10, max: 10 },
];

const SWITCH_FIELDS = [
  { name: 'labelShowShopName', label: 'In tên cửa hàng' },
  { name: 'labelShowPrice', label: 'In giá bán' },
  {
    name: 'autoPrintLabelsOnPurchase',
    label: 'Mở danh sách in tem sau khi lưu phiếu nhập',
  },
];

// Label printer fields (System → In ấn → Tem, edition flag `labels`).
const LabelPrintFields = ({ printers, canChoose, onTest }) => (
  <>
    <PrinterSelectItem
      name="labelPrinterName"
      label="Máy in tem"
      printers={printers}
      canChoose={canChoose}
    />
    <Form.Item label="Khổ tem" name="labelPreset">
      <Select options={LABEL_PRESET_OPTIONS} />
    </Form.Item>
    <div className="form-grid">
      {NUMBER_FIELDS.map(({ name, label, min, max }) => (
        <Form.Item key={name} label={label} name={name}>
          <InputNumber
            min={min}
            max={max}
            step={name === 'labelColumns' ? 1 : 0.5}
            precision={name === 'labelColumns' ? 0 : 1}
            style={{ width: '100%' }}
          />
        </Form.Item>
      ))}
    </div>
    {SWITCH_FIELDS.map(({ name, label }) => (
      <Form.Item key={name} label={label} name={name} valuePropName="checked">
        <Switch />
      </Form.Item>
    ))}
    <Form.Item>
      <Button onClick={onTest}>In thử tem</Button>
    </Form.Item>
  </>
);

export default LabelPrintFields;
