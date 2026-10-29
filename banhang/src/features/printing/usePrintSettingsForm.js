import { useEffect } from 'react';
import { Form, message } from 'antd';
import { useSettingsStore } from '../../store/settingsStore.js';
import {
  fromPrintFormValues,
  omitDesignerSettings,
  syncPresetFields,
  toPrintFormValues,
} from './domain/printSettingsForm.js';

// Form state shared by the receipt and label printer settings forms.
// Saving writes every print setting (stored values overlaid with this form) except
// the designer's receiptLayout/receiptLogo, which the receipt designer saves itself.
export const usePrintSettingsForm = ({ successMessage }) => {
  const settings = useSettingsStore((state) => state.settings);
  const update = useSettingsStore((state) => state.update);
  const [form] = Form.useForm();

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

  const readFormSettings = () =>
    omitDesignerSettings(
      fromPrintFormValues({
        ...toPrintFormValues(settings),
        ...form.getFieldsValue(true),
      })
    );

  // Test prints use the values on screen, saved or not (stored designer layout).
  const readPreviewSettings = () => ({ ...settings, ...readFormSettings() });

  const save = async () => {
    try {
      await form.validateFields();
    } catch {
      return; // field errors are shown by the form
    }
    try {
      const values = readFormSettings();
      await update(values);
      form.resetFields(); // clears "touched"
      form.setFieldsValue(toPrintFormValues({ ...settings, ...values }));
      message.success(successMessage);
    } catch (error) {
      message.error(error.message || 'Không lưu được cài đặt máy in.');
    }
  };

  return { form, handleValuesChange, readPreviewSettings, save };
};
