import { Button, Form } from 'antd';
import { printSampleLabels } from '../samplePrints.js';
import { usePrintSettingsForm } from '../usePrintSettingsForm.js';
import LabelPrintFields from './LabelPrintFields.jsx';

// Label printer settings (System → In ấn → Tem, edition flag `labels`); owns its form.
// `printers`/`canChoose` come from usePrinters() in the parent (read once).
const LabelPrintSettings = ({ printers, canChoose }) => {
  const { form, handleValuesChange, readPreviewSettings, save } =
    usePrintSettingsForm({ successMessage: 'Đã lưu cài đặt tem.' });

  return (
    <Form
      form={form}
      layout="vertical"
      style={{ maxWidth: 640 }}
      onValuesChange={handleValuesChange}
    >
      <LabelPrintFields
        printers={printers}
        canChoose={canChoose}
        onTest={() => printSampleLabels(readPreviewSettings())}
      />
      <Button type="primary" onClick={save}>
        Lưu cài đặt tem
      </Button>
    </Form>
  );
};

export default LabelPrintSettings;
