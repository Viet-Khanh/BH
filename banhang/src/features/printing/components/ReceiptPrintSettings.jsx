import { Button, Form, Radio, Tooltip } from 'antd';
import { RECEIPT_PAPER_OPTIONS } from '../domain/printSettingsForm.js';
import { printSampleReceipt } from '../samplePrints.js';
import { usePrintSettingsForm } from '../usePrintSettingsForm.js';
import PrinterSelectItem from './PrinterSelectItem.jsx';

// Receipt printer and paper (System → In ấn → Hoá đơn); owns its form.
// `printers`/`canChoose` come from usePrinters() in the parent (read once).
const ReceiptPrintSettings = ({ printers, canChoose }) => {
  const { form, handleValuesChange, readPreviewSettings, save } =
    usePrintSettingsForm({ successMessage: 'Đã lưu cài đặt máy in hoá đơn.' });
  const paper = Form.useWatch('receiptPaper', form);

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
      <Form.Item>
        <Tooltip
          title={
            paper === '58mm' ? '' : 'Chọn khổ 58mm để in thử hoá đơn cuộn.'
          }
        >
          <Button
            onClick={() => printSampleReceipt(readPreviewSettings())}
            disabled={paper !== '58mm'}
          >
            In thử
          </Button>
        </Tooltip>
      </Form.Item>
      <Button type="primary" onClick={save}>
        Lưu máy in hoá đơn
      </Button>
    </Form>
  );
};

export default ReceiptPrintSettings;
