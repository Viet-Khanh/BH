import { useMemo } from 'react';
import { Button, Form, InputNumber } from 'antd';
import { usePrintSettingsForm } from '../usePrintSettingsForm.js';
import PrinterSelectItem from './PrinterSelectItem.jsx';
import ReceiptPaperFields from './ReceiptPaperFields.jsx';
import ReceiptDesigner from './receiptDesigner/ReceiptDesigner.jsx';

const withoutUndefined = (values) =>
  Object.fromEntries(
    Object.entries(values).filter(([, value]) => value !== undefined)
  );

// Receipt printer, paper and copies (System → In ấn → Hoá đơn); owns its form.
// Roll paper on screen → the receipt designer below (own state, own "Lưu", "In thử").
// `printers`/`canChoose` come from usePrinters() in the parent (read once).
const ReceiptPrintSettings = ({ printers, canChoose }) => {
  const { form, handleValuesChange, readPreviewSettings, save } =
    usePrintSettingsForm({ successMessage: 'Đã lưu cài đặt in hoá đơn.' });
  const watch = { form, preserve: true };
  const receiptPaper = Form.useWatch('receiptPaper', watch);
  const receiptWidthMm = Form.useWatch('receiptWidthMm', watch);
  const receiptMarginMm = Form.useWatch('receiptMarginMm', watch);
  const paperSettings = useMemo(
    () => withoutUndefined({ receiptPaper, receiptWidthMm, receiptMarginMm }),
    [receiptPaper, receiptWidthMm, receiptMarginMm]
  );
  const isRoll = Boolean(receiptPaper) && receiptPaper !== 'auto';

  return (
    <>
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
        <ReceiptPaperFields paperSettings={paperSettings} />
        <Form.Item label="Số bản in" name="printCopies">
          <InputNumber min={1} max={10} precision={0} style={{ width: 120 }} />
        </Form.Item>
        <Button type="primary" onClick={save}>
          Lưu
        </Button>
      </Form>
      {isRoll && (
        <ReceiptDesigner
          paperSettings={paperSettings}
          readPreviewSettings={readPreviewSettings}
        />
      )}
    </>
  );
};

export default ReceiptPrintSettings;
