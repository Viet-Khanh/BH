import { Button, Form, InputNumber, Radio, Tooltip } from 'antd';
import { RECEIPT_PAPER_OPTIONS } from '../domain/printSettingsForm.js';
import { printSampleReceipt } from '../samplePrints.js';
import { usePrintSettingsForm } from '../usePrintSettingsForm.js';
import PrinterSelectItem from './PrinterSelectItem.jsx';

// Copies, receipt printer and paper (System → In ấn → Hoá đơn); owns its form.
// `printers`/`canChoose` come from usePrinters() in the parent (read once).
const ReceiptPrintSettings = ({ printers, canChoose }) => {
  const { form, handleValuesChange, readPreviewSettings, save } =
    usePrintSettingsForm({ successMessage: 'Đã lưu cài đặt in hoá đơn.' });
  const paper = Form.useWatch('receiptPaper', form);
  const isRoll = Boolean(paper) && paper !== 'auto';

  return (
    <Form
      form={form}
      layout="vertical"
      style={{ maxWidth: 640 }}
      onValuesChange={handleValuesChange}
    >
      <PrinterSelectItem
        name="receiptPrinterName"
        label="Máy in hoá đơn"
        printers={printers}
        canChoose={canChoose}
      />
      <Form.Item label="Khổ giấy hoá đơn" name="receiptPaper">
        <Radio.Group options={RECEIPT_PAPER_OPTIONS} />
      </Form.Item>
      <Form.Item label="Số bản in" name="printCopies">
        <InputNumber min={1} max={10} precision={0} style={{ width: 120 }} />
      </Form.Item>
      <Form.Item>
        <Tooltip title={isRoll ? '' : 'Chọn khổ giấy cuộn để in thử hoá đơn.'}>
          <Button
            onClick={() => printSampleReceipt(readPreviewSettings())}
            disabled={!isRoll}
          >
            In thử
          </Button>
        </Tooltip>
      </Form.Item>
      <Button type="primary" onClick={save}>
        Lưu
      </Button>
    </Form>
  );
};

export default ReceiptPrintSettings;
