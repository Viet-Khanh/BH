import { useEffect } from 'react';
import { Button, Divider, Form, message, Radio, Tooltip } from 'antd';
import { useEditionFeature } from '../../../platform/useActiveModule.js';
import { useSettingsStore } from '../../../store/settingsStore.js';
import {
  fromPrintFormValues,
  RECEIPT_PAPER_OPTIONS,
  syncPresetFields,
  toPrintFormValues,
} from '../domain/printSettingsForm.js';
import { printSampleLabels, printSampleReceipt } from '../samplePrints.js';
import { usePrinters } from '../usePrinters.js';
import LabelPrintFields from './LabelPrintFields.jsx';
import PrinterSelectItem from './PrinterSelectItem.jsx';

// "Máy in & tem" section of the System page; owns its form.
const PrintSettingsSection = () => {
  const { settings, update } = useSettingsStore();
  const labelsEnabled = useEditionFeature('labels');
  const { printers, canChoose } = usePrinters();
  const [form] = Form.useForm();

  const paper = Form.useWatch('receiptPaper', form);

  // Load settings on first render and when the form has no unsaved edits.
  useEffect(() => {
    if (!form.isFieldsTouched()) {
      form.setFieldsValue(toPrintFormValues(settings));
    }
  }, [form, settings]);

  const handleValuesChange = (changed, all) => {
    const patch = syncPresetFields(changed, all);
    if (patch) form.setFieldsValue(patch);
  };

  // Stored print settings overlaid with the form (hidden label fields keep their values).
  const readFormSettings = () =>
    fromPrintFormValues({
      ...toPrintFormValues(settings),
      ...form.getFieldsValue(true),
    });

  const save = async () => {
    await form.validateFields();
    try {
      const values = readFormSettings();
      await update(values);
      form.resetFields(); // clears "touched"
      form.setFieldsValue(toPrintFormValues({ ...settings, ...values }));
      message.success('Đã lưu cài đặt máy in & tem.');
    } catch (error) {
      message.error(error.message || 'Không lưu được cài đặt máy in.');
    }
  };

  // Test prints use the values on screen, saved or not.
  const testReceipt = () =>
    printSampleReceipt({ ...settings, ...readFormSettings() });
  const testLabels = () =>
    printSampleLabels({ ...settings, ...readFormSettings() });

  return (
    <>
      <div className="section-title">Máy in & tem</div>
      <Form
        form={form}
        layout="vertical"
        style={{ maxWidth: 640 }}
        onValuesChange={handleValuesChange}
      >
        <Divider orientation="left" plain>
          Hoá đơn bán hàng
        </Divider>
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
            <Button onClick={testReceipt} disabled={paper !== '58mm'}>
              In thử
            </Button>
          </Tooltip>
        </Form.Item>
        {labelsEnabled && (
          <LabelPrintFields
            printers={printers}
            canChoose={canChoose}
            onTest={testLabels}
          />
        )}
        <Button type="primary" onClick={save}>
          Lưu cài đặt máy in & tem
        </Button>
      </Form>
    </>
  );
};

export default PrintSettingsSection;
