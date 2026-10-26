import { Checkbox, Form, Input, Modal } from 'antd';
import { useEffect, useState } from 'react';
import {
  initialRequestValues,
  isWalkInCustomer,
} from '../../domain/buyerRequest.js';

const TAX_CODE = /^\d{10}(-\d{3})?$|^\d{12}$/;

// Buyer details for the e-invoice, prefilled from the selected customer.
const EinvoiceBuyerModal = ({ open, request, customer, onCancel, onSave }) => {
  const [form] = Form.useForm();
  const [saveToCustomer, setSaveToCustomer] = useState(false);
  const canSaveToCustomer = !isWalkInCustomer(customer);

  useEffect(() => {
    if (!open) return;
    form.setFieldsValue(initialRequestValues(request, customer));
    setSaveToCustomer(false);
  }, [open, request, customer, form]);

  const submit = async () => {
    const values = await form.validateFields();
    onSave(values, saveToCustomer && canSaveToCustomer);
  };

  return (
    <Modal
      open={open}
      title="Thông tin xuất hoá đơn điện tử"
      okText="Lưu"
      cancelText="Huỷ"
      onOk={submit}
      onCancel={onCancel}
      destroyOnClose
    >
      <Form form={form} layout="vertical">
        <Form.Item
          label="Mã số thuế"
          name="taxCode"
          rules={[
            {
              pattern: TAX_CODE,
              message: 'MST gồm 10 số, 10 số-3 số, hoặc số CCCD 12 số.',
            },
          ]}
        >
          <Input placeholder="Để trống nếu khách là cá nhân" />
        </Form.Item>
        <Form.Item
          noStyle
          shouldUpdate={(prev, next) => prev.taxCode !== next.taxCode}
        >
          {({ getFieldValue }) => (
            <Form.Item
              label="Tên đơn vị"
              name="companyName"
              rules={[
                {
                  required: Boolean(getFieldValue('taxCode')),
                  message: 'Nhập tên đơn vị theo đăng ký thuế.',
                },
              ]}
            >
              <Input />
            </Form.Item>
          )}
        </Form.Item>
        <Form.Item label="Người mua hàng" name="buyerName">
          <Input />
        </Form.Item>
        <Form.Item label="Địa chỉ" name="address">
          <Input />
        </Form.Item>
        <Form.Item
          label="Email nhận hoá đơn"
          name="email"
          rules={[{ type: 'email', message: 'Email không hợp lệ.' }]}
        >
          <Input />
        </Form.Item>
        {canSaveToCustomer && (
          <Checkbox
            checked={saveToCustomer}
            onChange={(event) => setSaveToCustomer(event.target.checked)}
          >
            Lưu MST, email, địa chỉ, người mua vào khách hàng {customer.name}
          </Checkbox>
        )}
      </Form>
    </Modal>
  );
};

export default EinvoiceBuyerModal;
