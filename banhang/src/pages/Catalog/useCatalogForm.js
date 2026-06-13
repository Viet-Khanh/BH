import { useState } from 'react';
import { Form, Modal, message } from 'antd';
import { v4 as uuid } from 'uuid';
import { buildCodeFromName } from './catalogUtils.js';

const useCatalogForm = ({
  activeKey,
  addProduct,
  updateProduct,
  removeProduct,
  addCustomer,
  updateCustomer,
  removeCustomer,
  addSupplier,
  updateSupplier,
  removeSupplier,
  addUnit,
  updateUnit,
  removeUnit,
}) => {
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [codeEdited, setCodeEdited] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form] = Form.useForm();

  const closeModal = () => {
    setModalOpen(false);
  };

  const resetEditState = () => {
    setModalOpen(false);
    setEditing(null);
    setCodeEdited(false);
  };

  const openCreate = () => {
    setEditing(null);
    form.resetFields();
    setCodeEdited(false);
    setModalOpen(true);
  };

  const openEdit = (record) => {
    setEditing(record);
    form.setFieldsValue(record);
    setCodeEdited(activeKey === 'products');
    setModalOpen(true);
  };

  const handleDelete = (record) => {
    Modal.confirm({
      title: 'Xóa dữ liệu?',
      content: 'Thao tác này không thể hoàn tác.',
      okText: 'Xóa',
      cancelText: 'Hủy',
      onOk: async () => {
        if (activeKey === 'customers') await removeCustomer(record.id);
        else if (activeKey === 'suppliers') await removeSupplier(record.id);
        else if (activeKey === 'units') await removeUnit(record.id);
        else await removeProduct(record.id);
        message.success('Đã xóa.');
      },
    });
  };

  const handleNameChange = (event) => {
    const name = event.target.value || '';
    if (!codeEdited) {
      form.setFieldsValue({ code: buildCodeFromName(name) });
    }
  };

  const handleCodeChange = (event) => {
    const value = event.target.value || '';
    setCodeEdited(value.trim().length > 0);
  };

  const handleSave = async () => {
    let values;
    try {
      values = await form.validateFields();
    } catch {
      return;
    }

    setSaving(true);
    try {
      if (activeKey === 'products') {
        const payload = {
          ...values,
          code: values.code || buildCodeFromName(values.name || ''),
          avgCost: Number(values.avgCost || 0),
          sellPriceDefault: Number(values.sellPriceDefault || 0),
          sellPriceWholesale: Number(values.sellPriceWholesale || 0),
          openingStock: Number(values.openingStock || 0),
          excludeFromProfit: Boolean(values.excludeFromProfit),
        };
        if (editing) {
          await updateProduct(editing.id, payload);
        } else {
          await addProduct({
            ...payload,
            id: uuid(),
            createdAt: new Date().toISOString(),
          });
        }
      }

      if (activeKey === 'customers') {
        if (editing) await updateCustomer(editing.id, values);
        else await addCustomer({ ...values, id: uuid() });
      }

      if (activeKey === 'suppliers') {
        if (editing) await updateSupplier(editing.id, values);
        else await addSupplier({ ...values, id: uuid() });
      }

      if (activeKey === 'units') {
        if (editing) await updateUnit(editing.id, values);
        else
          await addUnit({
            ...values,
            id: uuid(),
            createdAt: new Date().toISOString(),
          });
      }

      message.success('Đã lưu.');
      setModalOpen(false);
    } catch (error) {
      message.error(error.message || 'Không thể lưu dữ liệu.');
    } finally {
      setSaving(false);
    }
  };

  return {
    form,
    modalOpen,
    editing,
    saving,
    closeModal,
    resetEditState,
    openCreate,
    openEdit,
    handleDelete,
    handleNameChange,
    handleCodeChange,
    handleSave,
  };
};

export default useCatalogForm;
