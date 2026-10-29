import { Form, message } from 'antd';
import { useState } from 'react';
import { useProductCodeField } from '../../../features/productCodes/useProductCodeField.js';

// "Thêm mặt hàng" inside the product modal: form state, code autofill and save.
// Initials are de-duplicated against `products` (those loaded on the screen);
// the backend rejects any remaining duplicate and the form shows its message.
export const useQuickCreateProduct = ({
  onCreateProduct,
  onCreated,
  products = [],
}) => {
  const [form] = Form.useForm();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const codeField = useProductCodeField(form);
  const canCreate = typeof onCreateProduct === 'function';

  const openForm = () => {
    if (!canCreate) return;
    form.resetFields();
    codeField.startCreate();
    setOpen(true);
  };

  const closeForm = () => {
    if (!loading) setOpen(false);
  };

  const save = async () => {
    if (!canCreate) return;
    let values;
    try {
      values = await form.validateFields();
    } catch {
      return;
    }
    setLoading(true);
    try {
      const code = codeField.resolveCode(
        values,
        (products || []).map((product) => product.code)
      );
      const created = await onCreateProduct({ ...values, code });
      if (!created?.id) throw new Error('Không thể tạo sản phẩm.');
      setOpen(false);
      form.resetFields();
      onCreated(created);
      message.success('Đã tạo sản phẩm.');
    } catch (error) {
      message.error(
        `Không thể tạo sản phẩm: ${error.message || 'Lỗi không xác định'}`
      );
    } finally {
      setLoading(false);
    }
  };

  return {
    form,
    open,
    loading,
    canCreate,
    openForm,
    closeForm,
    handleNameChange: codeField.handleNameChange,
    handleCodeChange: codeField.handleCodeChange,
    save,
  };
};
