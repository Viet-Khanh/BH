import { Button, Form, Modal, Table, Tabs, message } from 'antd';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { v4 as uuid } from 'uuid';
import { useCustomerStore } from '../../store/customerStore.js';
import { useProductStore } from '../../store/productStore.js';
import { useSettingsStore } from '../../store/settingsStore.js';
import { useSupplierStore } from '../../store/supplierStore.js';
import { useUnitStore } from '../../store/unitStore.js';
import CatalogFormModal from './CatalogFormModal.jsx';
import OpeningImportPreviewModal from './OpeningImportPreviewModal.jsx';
import CatalogTabContent from './CatalogTabContent.jsx';
import { buildCodeFromName, hasSearchMatch } from './catalogUtils.js';
import { getColumns, getExportConfig } from './catalogViewConfigs.jsx';
import useCatalogImport from './useCatalogImport.js';
import useOpeningImport from './useOpeningImport.js';
import { formatMoney } from '../../utils/moneyFormat.js';

const asNumber = (value) => Number(value || 0);
const hasRetailPriceEqualCost = (product) =>
  asNumber(product.sellPriceDefault) === asNumber(product.avgCost);
const needsAvgCostFromRetailPrice = (product) =>
  asNumber(product.avgCost) <= 0 && asNumber(product.sellPriceDefault) > 0;

const Catalog = () => {
  const navigate = useNavigate();
  const {
    items: products,
    add: addProduct,
    update: updateProduct,
    remove: removeProduct,
    bulkAdd: bulkAddProducts,
    bulkUpdatePricesByName,
    bulkFillMissingAvgCostFromRetail,
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
  const { settings, load: loadSettings } = useSettingsStore();

  const [activeKey, setActiveKey] = useState('products');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [codeEdited, setCodeEdited] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [saving, setSaving] = useState(false);
  const [productCostFilterActive, setProductCostFilterActive] =
    useState(false);
  const [avgCostPreviewOpen, setAvgCostPreviewOpen] = useState(false);
  const [avgCostUpdating, setAvgCostUpdating] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    const bootstrap = async () => {
      await Promise.all([
        loadProducts(),
        loadCustomers(),
        loadSuppliers(),
        loadUnits(),
        loadSettings(),
      ]);
    };
    bootstrap();
  }, [loadProducts, loadCustomers, loadSuppliers, loadUnits, loadSettings]);

  const showSensitiveInfo = Boolean(settings?.showSensitiveInfo);

  const activeProducts = useMemo(
    () => products.filter((item) => !item.isDeleted),
    [products]
  );
  const productsMissingAvgCost = useMemo(
    () => activeProducts.filter(needsAvgCostFromRetailPrice),
    [activeProducts]
  );
  const priceCostMatchedCount = useMemo(
    () => activeProducts.filter(hasRetailPriceEqualCost).length,
    [activeProducts]
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

  const {
    previewing: openingImporting,
    previewTarget: openingImportTarget,
    previewResult,
    previewOpen,
    committing: openingImportCommitting,
    fileInputRef: openingFileInputRef,
    handleDownloadOpeningTemplate,
    triggerOpeningImport,
    handleOpeningFileChange,
    handleConfirmOpeningImport,
    closePreview,
    resetOpeningImportState,
  } = useOpeningImport({
    loadCustomers,
    loadSuppliers,
  });

  const dataSource = useMemo(() => {
    let source = activeProducts;
    if (activeKey === 'customers') source = activeCustomers;
    if (activeKey === 'suppliers') source = activeSuppliers;
    if (activeKey === 'units') source = activeUnits;
    if (activeKey === 'units') return source;
    if (
      activeKey === 'products' &&
      showSensitiveInfo &&
      productCostFilterActive
    ) {
      source = source.filter(hasRetailPriceEqualCost);
    }
    return source.filter((item) => hasSearchMatch(item, searchText));
  }, [
    activeKey,
    activeProducts,
    activeCustomers,
    activeSuppliers,
    activeUnits,
    productCostFilterActive,
    searchText,
    showSensitiveInfo,
  ]);

  const handleTabChange = (key) => {
    setActiveKey(key);
    setSearchText('');
    setModalOpen(false);
    setEditing(null);
    setCodeEdited(false);
    setProductCostFilterActive(false);
    resetImportState();
    resetOpeningImportState();
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

  const handleOpenAvgCostPreview = () => {
    if (!productsMissingAvgCost.length) {
      message.info('Không có sản phẩm cần cập nhật Giá vốn.');
      return;
    }
    setAvgCostPreviewOpen(true);
  };

  const handleConfirmAvgCostUpdate = async () => {
    setAvgCostUpdating(true);
    try {
      const result = await bulkFillMissingAvgCostFromRetail(
        productsMissingAvgCost.map((product) => product.id)
      );
      message.success(
        `Đã cập nhật Giá vốn cho ${Number(result?.updatedCount || 0)} sản phẩm.`
      );
      setAvgCostPreviewOpen(false);
    } catch (error) {
      message.error(error.message || 'Không thể cập nhật Giá vốn.');
    } finally {
      setAvgCostUpdating(false);
    }
  };

  const avgCostPreviewColumns = useMemo(
    () => [
      { title: 'Mã hàng', dataIndex: 'code', width: 140 },
      { title: 'Tên hàng', dataIndex: 'name' },
      {
        title: 'Giá vốn hiện tại',
        dataIndex: 'avgCost',
        width: 160,
        align: 'right',
        render: (value) => formatMoney(value),
      },
      {
        title: 'Đơn giá lẻ',
        dataIndex: 'sellPriceDefault',
        width: 160,
        align: 'right',
        render: (value) => formatMoney(value),
      },
      {
        title: 'Giá vốn mới',
        dataIndex: 'sellPriceDefault',
        width: 160,
        align: 'right',
        render: (value) => formatMoney(value),
      },
    ],
    []
  );

  const columns = useMemo(
    () =>
      getColumns({
        activeKey,
        onEdit: openEdit,
        onDelete: handleDelete,
        showSensitiveInfo,
      }),
    [activeKey, showSensitiveInfo]
  );
  const exportConfig = useMemo(
    () => getExportConfig({ activeKey, dataSource, showSensitiveInfo }),
    [activeKey, dataSource, showSensitiveInfo]
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
                onDownloadOpeningTemplate={handleDownloadOpeningTemplate}
                onTriggerOpeningImport={triggerOpeningImport}
                importing={importing}
                importTarget={importTarget}
                importMode={importMode}
                openingImporting={openingImporting}
                openingImportTarget={openingImportTarget}
                showSensitiveInfo={showSensitiveInfo}
                productCostFilterActive={productCostFilterActive}
                priceCostMatchedCount={priceCostMatchedCount}
                missingAvgCostCount={productsMissingAvgCost.length}
                onToggleProductCostFilter={() =>
                  setProductCostFilterActive((value) => !value)
                }
                onOpenAvgCostPreview={handleOpenAvgCostPreview}
                exportConfig={exportConfig}
                dataSource={dataSource}
                columns={columns}
                onFileChange={handleFileChange}
                fileInputRef={fileInputRef}
                onOpeningFileChange={handleOpeningFileChange}
                openingFileInputRef={openingFileInputRef}
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
                onDownloadOpeningTemplate={handleDownloadOpeningTemplate}
                onTriggerOpeningImport={triggerOpeningImport}
                importing={importing}
                importTarget={importTarget}
                importMode={importMode}
                openingImporting={openingImporting}
                openingImportTarget={openingImportTarget}
                exportConfig={exportConfig}
                dataSource={dataSource}
                columns={columns}
                onFileChange={handleFileChange}
                fileInputRef={fileInputRef}
                onOpeningFileChange={handleOpeningFileChange}
                openingFileInputRef={openingFileInputRef}
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
                onDownloadOpeningTemplate={handleDownloadOpeningTemplate}
                onTriggerOpeningImport={triggerOpeningImport}
                importing={importing}
                importTarget={importTarget}
                importMode={importMode}
                openingImporting={openingImporting}
                openingImportTarget={openingImportTarget}
                exportConfig={exportConfig}
                dataSource={dataSource}
                columns={columns}
                onFileChange={handleFileChange}
                fileInputRef={fileInputRef}
                onOpeningFileChange={handleOpeningFileChange}
                openingFileInputRef={openingFileInputRef}
              />
            ),
          },
        ]}
      />

      <OpeningImportPreviewModal
        open={previewOpen}
        previewResult={previewResult}
        onCancel={closePreview}
        onConfirm={handleConfirmOpeningImport}
        confirmLoading={openingImportCommitting}
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

      <Modal
        title="Xác nhận cập nhật Giá vốn"
        open={avgCostPreviewOpen}
        onCancel={() => setAvgCostPreviewOpen(false)}
        onOk={handleConfirmAvgCostUpdate}
        okText="Cập nhật"
        cancelText="Hủy"
        confirmLoading={avgCostUpdating}
        width={900}
      >
        <Table
          size="small"
          bordered
          rowKey="id"
          dataSource={productsMissingAvgCost}
          columns={avgCostPreviewColumns}
          pagination={{ pageSize: 8 }}
          scroll={{ x: 760, y: 360 }}
        />
      </Modal>
    </div>
  );
};

export default Catalog;
