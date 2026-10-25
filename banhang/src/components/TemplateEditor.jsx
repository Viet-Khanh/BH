import { useEffect, useMemo, useState } from 'react';
import { Button, Form, Input } from 'antd';
import InvoicePreview from './InvoicePreview.jsx';
import { useEditionFeature } from '../editions/useEdition.js';
import { renderInvoiceTemplate } from '../utils/renderTemplate.js';
import { buildSampleInvoice } from '../utils/sampleInvoice.js';

const { TextArea } = Input;

const TemplateEditor = ({
  settings,
  onSave,
  products = [],
  customers = [],
  showShopFields = true,
}) => {
  const [form] = Form.useForm();
  const [template, setTemplate] = useState(settings.invoiceTemplateHtml);

  useEffect(() => {
    if (showShopFields) {
      form.setFieldsValue(settings);
    }
    setTemplate(settings.invoiceTemplateHtml);
  }, [form, settings, showShopFields]);

  const dimensions = useEditionFeature('dimensions');
  const sampleInvoice = useMemo(
    () => buildSampleInvoice(products[0], { dimensions }),
    [products, dimensions]
  );

  const sampleCustomer = customers[0];

  const previewHtml = useMemo(() => {
    return renderInvoiceTemplate({
      template,
      invoice: sampleInvoice,
      customer: sampleCustomer,
      payments: [],
      products,
      settings: { ...settings, invoiceTemplateHtml: template },
    });
  }, [template, sampleInvoice, sampleCustomer, products, settings]);

  const handleSave = async () => {
    let payload = { invoiceTemplateHtml: template };
    if (showShopFields) {
      const values = await form.validateFields();
      payload = {
        ...payload,
        shopName: values.shopName,
        shopPhone: values.shopPhone,
        shopAddress: values.shopAddress,
      };
    }
    onSave(payload);
  };

  return (
    <div className="template-editor">
      <div>
        <Form form={form} layout="vertical">
          {showShopFields && (
            <>
              <Form.Item
                label="Tên shop"
                name="shopName"
                rules={[{ required: true }]}
              >
                <Input size="large" />
              </Form.Item>
              <Form.Item label="Số điện thoại" name="shopPhone">
                <Input size="large" />
              </Form.Item>
              <Form.Item label="Địa chỉ" name="shopAddress">
                <Input size="large" />
              </Form.Item>
            </>
          )}
          <Form.Item label="HTML Template">
            <TextArea
              rows={14}
              value={template}
              onChange={(event) => setTemplate(event.target.value)}
            />
          </Form.Item>
        </Form>
        <Button
          size="large"
          type="primary"
          className="btn-primary"
          onClick={handleSave}
        >
          Lưu mẫu hóa đơn
        </Button>
      </div>
      <div>
        <div className="section-title">Xem trước</div>
        <InvoicePreview html={previewHtml} />
      </div>
    </div>
  );
};

export default TemplateEditor;
