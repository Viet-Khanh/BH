import { Form, Select } from 'antd';
import { toPrinterOptions } from '../domain/printSettingsForm.js';

const WEB_HINT =
  'Chỉ chọn được trong ứng dụng máy tính; trên web chọn máy khi in.';

// Printer select of the print settings form (disabled with a hint on the web).
const PrinterSelectItem = ({ name, label, printers, canChoose }) => {
  const form = Form.useFormInstance();
  const current = Form.useWatch(name, form);
  return (
    <Form.Item label={label} name={name} extra={canChoose ? null : WEB_HINT}>
      <Select
        disabled={!canChoose}
        options={toPrinterOptions(printers, current)}
      />
    </Form.Item>
  );
};

export default PrinterSelectItem;
