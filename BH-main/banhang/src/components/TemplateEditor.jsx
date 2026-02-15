import { useEffect, useMemo, useState } from 'react';
import { Button, Form, Input } from 'antd';
import dayjs from 'dayjs';
import InvoicePreview from './InvoicePreview.jsx';
import { renderInvoiceTemplate } from '../utils/renderTemplate.js';

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

  const sampleInvoice = useMemo(() => {
    const product = products[0];
    return {
      code: 'INV-20240101-001',
      date: dayjs().toISOString(),
      items: product
        ? [
            {
              productId: product.id,
              qty: 2,
              unitPrice: product.sellPriceDefault || 50000,
              discount: 0,
              lineTotal: (product.sellPriceDefault || 50000) * 2,
            },
          ]
        : [],
      total: product ? (product.sellPriceDefault || 50000) * 2 : 0,
    };
  }, [products]);

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
              <Form.Item label="Tên shop" name="shopName" rules={[{ required: true }]}>
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
        <Button size="large" type="primary" className="btn-primary" onClick={handleSave}>
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
