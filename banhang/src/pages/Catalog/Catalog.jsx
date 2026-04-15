import { useEffect, useMemo, useState } from 'react';
import { Button, Form, Modal, Tabs, message } from 'antd';
import { v4 as uuid } from 'uuid';
import { useNavigate } from 'react-router-dom';
import { useProductStore } from '../../store/productStore.js';
import { useCustomerStore } from '../../store/customerStore.js';
import { useSupplierStore } from '../../store/supplierStore.js';
import { useUnitStore } from '../../store/unitStore.js';
import CatalogFormModal from './CatalogFormModal.jsx';
import CatalogTabContent from './CatalogTabContent.jsx';
import { buildCodeFromName, hasSearchMatch } from './catalogUtils.js';
import { getColumns, getExportConfig } from './catalogViewConfigs.jsx';
import useCatalogImport from './useCatalogImport.js';

const Catalog = () => {
  const navigate = useNavigate();
  const {
    items: products,
    add: addProduct,
    update: updateProduct,
    remove: removeProduct,
    bulkAdd: bulkAddProducts,
    bulkUpdatePricesByName,
    load: loadProducts,
  } = useProductStore();
  const {
    items: customers,
    add: addCustomer,
    update: updateCustomer,
    remove: removeCustomer,
    bulkAdd: bulkAddCustomers,
    load: loadCustomers,
  } = useCustomerStore();
  const {
    items: suppliers,
    add: addSupplier,
    update: updateSupplier,
    remove: removeSupplier,
    bulkAdd: bulkAddSuppliers,
    load: loadSuppliers,
  } = useSupplierStore();
  const {
    items: units,
    add: addUnit,
    update: updateUnit,
    remove: removeUnit,
    bulkAdd: bulkAddUnits,
    load: loadUnits,
  } = useUnitStore();

  const [activeKey, setActiveKey] = useState('products');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [codeEdited, setCodeEdited] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [saving, setSaving] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    const bootstrap = async () => {
      await Promise.all([
        loadProducts(),
        loadCustomers(),
        loadSuppliers(),
        loadUnits(),
      ]);
    };
    bootstrap();
  }, [loadProducts, loadCustomers, loadSuppliers, loadUnits]);

  const activeProducts = useMemo(
    () => products.filter((item) => !item.isDeleted),
    [products]
  );
  const activeCustomers = useMemo(
    () => customers.filter((item) => !item.isDeleted),
    [customers]
  );
  const activeSuppliers = useMemo(
    () => suppliers.filter((item) => !item.isDeleted),
    [suppliers]
  );
  const activeUnits = useMemo(
    () => units.filter((item) => !item.isDeleted),
    [units]
  );

  const {
    importing,
    importTarget,
    importMode,
    fileInputRef,
    handleDownloadTemplate,
    triggerImport,
    handleFileChange,
    resetImportState,
  } = useCatalogImport({
    activeKey,
    products: activeProducts,
    bulkAddProducts,
    bulkAddCustomers,
    bulkAddSuppliers,
    bulkAddUnits,
    bulkUpdatePricesByName,
  });

  const dataSource = useMemo(() => {
    let source = activeProducts;
    if (activeKey === 'customers') source = activeCustomers;
    if (activeKey === 'suppliers') source = activeSuppliers;
    if (activeKey === 'units') source = activeUnits;
    if (activeKey === 'units') return source;
    return source.filter((item) => hasSearchMatch(item, searchText));
  }, [
    activeKey,
    activeProducts,
    activeCustomers,
    activeSuppliers,
    activeUnits,
    searchText,
  ]);

  const handleTabChange = (key) => {
    setActiveKey(key);
    setSearchText('');
    setModalOpen(false);
    setEditing(null);
    setCodeEdited(false);
    resetImportState();
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

  const columns = useMemo(
    () => getColumns({ activeKey, onEdit: openEdit, onDelete: handleDelete }),
    [activeKey]
  );
  const exportConfig = useMemo(
    () => getExportConfig({ activeKey, dataSource }),
    [activeKey, dataSource]
  );

  return (
    <div className="page-card">
      <div className="page-title">Danh mục</div>
      <div className="action-row">
        <Button size="large" onClick={() => navigate('/')}>
          Quay lại
        </Button>
        <Button
          size="large"
          type="primary"
          className="btn-primary"
          onClick={openCreate}
        >
          Tạo mới
        </Button>
      </div>

      <Tabs
        type="card"
        className="page-tabs"
        tabPosition="top"
        tabBarGutter={8}
        activeKey={activeKey}
        onChange={handleTabChange}
        items={[
          {
            key: 'products',
            label: 'Sản phẩm',
            children: (
              <CatalogTabContent
                tabKey="products"
                activeKey={activeKey}
                searchText={searchText}
                onSearchTextChange={setSearchText}
                onDownloadTemplate={handleDownloadTemplate}
                onDownloadPriceUpdateTemplate={(tabKey) =>
                  handleDownloadTemplate(tabKey, 'price-update')
                }
                onTriggerImport={triggerImport}
                onTriggerPriceUpdate={(tabKey) =>
                  triggerImport(tabKey, 'price-update')
                }
                importing={importing}
                importTarget={importTarget}
                importMode={importMode}
                exportConfig={exportConfig}
                dataSource={dataSource}
                columns={columns}
                onFileChange={handleFileChange}
                fileInputRef={fileInputRef}
              />
            ),
          },
          {
            key: 'customers',
            label: 'Khách hàng/Đại lý',
            children: (
              <CatalogTabContent
                tabKey="customers"
                activeKey={activeKey}
                searchText={searchText}
                onSearchTextChange={setSearchText}
                onDownloadTemplate={handleDownloadTemplate}
                onDownloadPriceUpdateTemplate={(tabKey) =>
                  handleDownloadTemplate(tabKey, 'price-update')
                }
                onTriggerImport={triggerImport}
                onTriggerPriceUpdate={(tabKey) =>
                  triggerImport(tabKey, 'price-update')
                }
                importing={importing}
                importTarget={importTarget}
                importMode={importMode}
                exportConfig={exportConfig}
                dataSource={dataSource}
                columns={columns}
                onFileChange={handleFileChange}
                fileInputRef={fileInputRef}
              />
            ),
          },
          {
            key: 'suppliers',
            label: 'Nhà cung cấp',
            children: (
              <CatalogTabContent
                tabKey="suppliers"
                activeKey={activeKey}
                searchText={searchText}
                onSearchTextChange={setSearchText}
                onDownloadTemplate={handleDownloadTemplate}
                onDownloadPriceUpdateTemplate={(tabKey) =>
                  handleDownloadTemplate(tabKey, 'price-update')
                }
                onTriggerImport={triggerImport}
                onTriggerPriceUpdate={(tabKey) =>
                  triggerImport(tabKey, 'price-update')
                }
                importing={importing}
                importTarget={importTarget}
                importMode={importMode}
                exportConfig={exportConfig}
                dataSource={dataSource}
                columns={columns}
                onFileChange={handleFileChange}
                fileInputRef={fileInputRef}
              />
            ),
          },
        ]}
      />

      <CatalogFormModal
        open={modalOpen}
        editing={editing}
        activeKey={activeKey}
        form={form}
        onCancel={() => setModalOpen(false)}
        onSave={handleSave}
        onNameChange={handleNameChange}
        onCodeChange={handleCodeChange}
        confirmLoading={saving}
      />
    </div>
  );
};

export default Catalog;
