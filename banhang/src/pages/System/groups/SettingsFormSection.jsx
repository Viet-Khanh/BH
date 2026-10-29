import { useEffect } from 'react';
import { Button, Form, message } from 'antd';
import { useSettingsStore } from '../../../store/settingsStore.js';

const pick = (source, names) =>
  Object.fromEntries(names.map((name) => [name, source?.[name]]));

const defaultToValues = (settings, names) => pick(settings, names);
const defaultFromValues = (values, names) => pick(values, names);

// A small settings form: fields (children) + "Lưu"; saves only `names`.
// `toValues`/`fromValues` (module-level functions) map settings ⇄ form values.
const SettingsFormSection = ({
  names,
  toValues = defaultToValues,
  fromValues = defaultFromValues,
  successMessage = 'Đã lưu cài đặt.',
  children,
}) => {
  const settings = useSettingsStore((state) => state.settings);
  const update = useSettingsStore((state) => state.update);
  const [form] = Form.useForm();

  // Follow the stored settings while the form has no unsaved edits.
  useEffect(() => {
    if (!form.isFieldsTouched()) {
      form.setFieldsValue(toValues(settings, names));
    }
  }, [form, settings, names, toValues]);

  const save = async () => {
    let values;
    try {
      values = pick(fromValues(await form.validateFields(), names), names);
    } catch {
      return; // field errors are shown by the form
    }
    try {
      await update(values);
      form.resetFields(); // clears "touched"
      form.setFieldsValue(
        toValues(useSettingsStore.getState().settings, names)
      );
      message.success(successMessage);
    } catch (error) {
      message.error(error?.message || 'Không lưu được cài đặt.');
    }
  };

  return (
    <Form form={form} layout="vertical" style={{ maxWidth: 640 }}>
      <div className="form-grid">{children}</div>
      <Button type="primary" className="btn-primary" onClick={save}>
        Lưu
      </Button>
    </Form>
  );
};

export default SettingsFormSection;
