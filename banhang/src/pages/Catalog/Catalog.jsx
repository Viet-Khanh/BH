import { Button, Tabs } from 'antd';
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import CatalogFormModal from './CatalogFormModal.jsx';
import CatalogTabContent from './CatalogTabContent.jsx';
import OpeningImportPreviewModal from './OpeningImportPreviewModal.jsx';
import ProductAvgCostPreviewModal from './ProductAvgCostPreviewModal.jsx';
import { hasSearchMatch } from './catalogUtils.js';
import { getColumns, getExportConfig } from './catalogViewConfigs.jsx';
import useCatalogData from './useCatalogData.js';
import useCatalogForm from './useCatalogForm.js';
import useCatalogImport from './useCatalogImport.js';
import useOpeningImport from './useOpeningImport.js';
import useProductAvgCostTools from './useProductAvgCostTools.js';

const getCreatedTime = (item) => {
  const time = new Date(item?.createdAt || 0).getTime();
  return Number.isFinite(time) ? time : 0;
};

const sortNewestCreatedFirst = (items = []) =>
  [...items].sort(
    (left, right) => getCreatedTime(right) - getCreatedTime(left)
  );

const Catalog = () => {
  const navigate = useNavigate();
  const {
    activeProducts,
    activeCustomers,
    activeSuppliers,
    activeUnits,
    showSensitiveInfo,
    addProduct,
    updateProduct,
    removeProduct,
    bulkAddProducts,
    bulkUpdatePricesByName,
    bulkFillMissingAvgCostFromRetail,
    addCustomer,
    updateCustomer,
    removeCustomer,
    bulkAddCustomers,
    loadCustomers,
    addSupplier,
    updateSupplier,
    removeSupplier,
    bulkAddSuppliers,
    loadSuppliers,
    addUnit,
    updateUnit,
    removeUnit,
    bulkAddUnits,
  } = useCatalogData();

  const [activeKey, setActiveKey] = useState('products');
  const [searchText, setSearchText] = useState('');
  const catalogForm = useCatalogForm({
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
  });
  const {
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
  } = catalogForm;
  const avgCostTools = useProductAvgCostTools({
    activeProducts,
    showSensitiveInfo,
    bulkFillMissingAvgCostFromRetail,
  });
  const {
    productCostFilterActive,
    productsMissingAvgCost,
    priceCostMatchedCount,
    missingAvgCostCount,
    avgCostPreviewOpen,
    avgCostUpdating,
    applyProductCostFilter,
    toggleProductCostFilter,
    resetProductCostFilter,
    openAvgCostPreview,
    closeAvgCostPreview,
    confirmAvgCostUpdate,
  } = avgCostTools;

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
    if (activeKey === 'products') {
      source = applyProductCostFilter(source);
    }
    const filteredSource = source.filter((item) =>
      hasSearchMatch(item, searchText)
    );
    if (activeKey === 'products') {
      return sortNewestCreatedFirst(filteredSource);
    }
    return filteredSource;
  }, [
    activeKey,
    activeProducts,
    activeCustomers,
    activeSuppliers,
    activeUnits,
    applyProductCostFilter,
    searchText,
  ]);

  const handleTabChange = (key) => {
    setActiveKey(key);
    setSearchText('');
    resetEditState();
    resetProductCostFilter();
    resetImportState();
    resetOpeningImportState();
  };

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

  const handleDownloadPriceUpdateTemplate = (tabKey) => {
    handleDownloadTemplate(tabKey, 'price-update');
  };

  const handleTriggerPriceUpdate = (tabKey) => {
    triggerImport(tabKey, 'price-update');
  };

  const catalogTabContentProps = {
    activeKey,
    searchText,
    onSearchTextChange: setSearchText,
    onDownloadTemplate: handleDownloadTemplate,
    onDownloadPriceUpdateTemplate: handleDownloadPriceUpdateTemplate,
    onTriggerImport: triggerImport,
    onTriggerPriceUpdate: handleTriggerPriceUpdate,
    onDownloadOpeningTemplate: handleDownloadOpeningTemplate,
    onTriggerOpeningImport: triggerOpeningImport,
    importing,
    importTarget,
    importMode,
    openingImporting,
    openingImportTarget,
    showSensitiveInfo,
    productCostFilterActive,
    priceCostMatchedCount,
    missingAvgCostCount,
    onToggleProductCostFilter: toggleProductCostFilter,
    onOpenAvgCostPreview: openAvgCostPreview,
    exportConfig,
    dataSource,
    columns,
    onFileChange: handleFileChange,
    fileInputRef,
    onOpeningFileChange: handleOpeningFileChange,
    openingFileInputRef,
  };

  const renderTabContent = (tabKey) => (
    <CatalogTabContent tabKey={tabKey} {...catalogTabContentProps} />
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
            children: renderTabContent('products'),
          },
          {
            key: 'customers',
            label: 'Khách hàng/Đại lý',
            children: renderTabContent('customers'),
          },
          {
            key: 'suppliers',
            label: 'Nhà cung cấp',
            children: renderTabContent('suppliers'),
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
        onCancel={closeModal}
        onSave={handleSave}
        onNameChange={handleNameChange}
        onCodeChange={handleCodeChange}
        confirmLoading={saving}
      />

      <ProductAvgCostPreviewModal
        open={avgCostPreviewOpen}
        products={productsMissingAvgCost}
        onCancel={closeAvgCostPreview}
        onConfirm={confirmAvgCostUpdate}
        confirmLoading={avgCostUpdating}
      />
    </div>
  );
};

export default Catalog;
