import { Button, Form, Switch } from 'antd';
import { PURCHASE_FORM_NAMES } from '../domain/printSettingsForm.js';
import { usePrintSettingsForm } from '../usePrintSettingsForm.js';

// Purchases F8 "Lưu và in" (System → In ấn → Nhập hàng): print the slip on the A4
// printer and, with the edition flag `labels`, open the label list. F12 prints nothing.
// Saves only PURCHASE_FORM_NAMES.
const PurchasePrintSettings = ({ labelsEnabled }) => {
  const { form, save } = usePrintSettingsForm({
    successMessage: 'Đã lưu cài đặt in phiếu nhập.',
    names: PURCHASE_FORM_NAMES,
  });

  return (
    <Form form={form} layout="vertical" style={{ maxWidth: 640 }}>
      <Form.Item
        label="In phiếu nhập (máy in A4)"
        name="purchasePrintSlip"
        valuePropName="checked"
      >
        <Switch />
      </Form.Item>
      {labelsEnabled && (
        <Form.Item
          label="Mở danh sách in tem"
          name="autoPrintLabelsOnPurchase"
          valuePropName="checked"
        >
          <Switch />
        </Form.Item>
      )}
      <Button type="primary" onClick={save}>
        Lưu
      </Button>
    </Form>
  );
};

export default PurchasePrintSettings;
