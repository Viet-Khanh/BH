import { Form, message } from 'antd';
import { useState } from 'react';
import { buildCodeFromName } from '../../../pages/Catalog/catalogUtils.js';

// "Thêm mặt hàng" inside the product modal: form state, code autofill and save.
export const useQuickCreateProduct = ({ onCreateProduct, onCreated }) => {
  const [form] = Form.useForm();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [codeEdited, setCodeEdited] = useState(false);
  const canCreate = typeof onCreateProduct === 'function';

  const openForm = () => {
    if (!canCreate) return;
    form.resetFields();
    setCodeEdited(false);
    setOpen(true);
  };

  const closeForm = () => {
    if (!loading) setOpen(false);
  };

  const handleNameChange = (event) => {
    if (codeEdited) return;
    form.setFieldsValue({ code: buildCodeFromName(event.target.value || '') });
  };

  const handleCodeChange = (event) => {
    setCodeEdited((event.target.value || '').trim().length > 0);
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
      const created = await onCreateProduct(values);
      if (!created?.id) throw new Error('Không thể tạo sản phẩm.');
      setOpen(false);
      form.resetFields();
      setCodeEdited(false);
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
    handleNameChange,
    handleCodeChange,
    save,
  };
};
