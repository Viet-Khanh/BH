import { Form, Input, message, Modal } from 'antd';
import { useEffect } from 'react';
import { setEinvoiceNumber } from '../../api/einvoiceApi.js';

// Records what the provider issued: number, series, lookup code.
const IssuedNumberModal = ({ item, open, onClose, onSaved }) => {
  const [form] = Form.useForm();

  useEffect(() => {
    if (!open) return;
    const { number, series, lookupCode } = item.einvoice || {};
    form.setFieldsValue({
      number: number || '',
      series: series || '',
      lookupCode: lookupCode || '',
    });
  }, [open, item, form]);

  const save = async () => {
    try {
      await setEinvoiceNumber(item.invoiceId, await form.validateFields());
      onClose();
      onSaved();
    } catch (error) {
      if (error?.message) message.error(error.message);
    }
  };

  return (
    <Modal
      open={open}
      title={`Hoá đơn điện tử của ${item.code}`}
      okText="Lưu"
      cancelText="Huỷ"
      onOk={save}
      onCancel={onClose}
    >
      <Form form={form} layout="vertical">
        <Form.Item label="Số hoá đơn" name="number">
          <Input placeholder="Số trên trang nhà cung cấp" />
        </Form.Item>
        <Form.Item label="Ký hiệu" name="series">
          <Input placeholder="Ví dụ 1C26TAA" />
        </Form.Item>
        <Form.Item label="Mã tra cứu" name="lookupCode">
          <Input placeholder="In lên phiếu để khách tự tra cứu" />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default IssuedNumberModal;
