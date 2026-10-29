import { Button, Form, Space } from 'antd';
import { DOCUMENT_FORM_NAMES } from '../domain/printSettingsForm.js';
import { printSampleDocument } from '../samplePrints.js';
import { usePrintSettingsForm } from '../usePrintSettingsForm.js';
import PrinterSelectItem from './PrinterSelectItem.jsx';

// A4/A5 printer (System → In ấn → Máy in A4): template invoices, purchase invoices,
// debt receipts, lists. Saves only `documentPrinterName`.
// `printers`/`canChoose` come from usePrinters() in the parent (read once).
const DocumentPrintSettings = ({ printers, canChoose }) => {
  const { form, readPreviewSettings, save } = usePrintSettingsForm({
    successMessage: 'Đã lưu máy in A4.',
    names: DOCUMENT_FORM_NAMES,
  });

  return (
    <Form form={form} layout="vertical" style={{ maxWidth: 640 }}>
      <PrinterSelectItem
        name="documentPrinterName"
        label="Máy in A4"
        printers={printers}
        canChoose={canChoose}
      />
      <Space>
        <Button onClick={() => printSampleDocument(readPreviewSettings())}>
          In thử A4
        </Button>
        <Button type="primary" onClick={save}>
          Lưu
        </Button>
      </Space>
    </Form>
  );
};

export default DocumentPrintSettings;
