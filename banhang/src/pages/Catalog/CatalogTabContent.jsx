import { Button, Input, Table } from 'antd';
import { useEffect, useState } from 'react';
import ExportActions from '../../components/ExportActions.jsx';

const SEARCH_PLACEHOLDERS = {
  products: 'Tìm kiếm sản phẩm...',
  customers: 'Tìm kiếm khách hàng/đại lý...',
  suppliers: 'Tìm kiếm nhà cung cấp...',
};

const buildPaginationConfig = (tabKey) => ({
  pageSize: tabKey === 'units' ? 8 : 100,
  showSizeChanger: tabKey !== 'units',
  pageSizeOptions: ['50', '100', '200'],
  showTotal: (total, range) => `${range[0]}-${range[1]} / ${total} dòng`,
});

const CatalogSearchInput = ({
  tabKey,
  searchText,
  onSearchTextChange,
}) => {
  const [searchInputValue, setSearchInputValue] = useState(searchText);

  useEffect(() => {
    setSearchInputValue(searchText);
  }, [searchText]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      if (searchInputValue !== searchText) {
        onSearchTextChange(searchInputValue);
      }
    }, 300);

    return () => window.clearTimeout(timeoutId);
  }, [onSearchTextChange, searchInputValue, searchText]);

  return (
    <Input
      allowClear
      placeholder={SEARCH_PLACEHOLDERS[tabKey] || 'Tìm kiếm...'}
      value={searchInputValue}
      onChange={(event) => setSearchInputValue(event.target.value)}
      style={{ maxWidth: 360 }}
    />
  );
};

const CatalogTabContent = ({
  tabKey,
  activeKey,
  searchText,
  onSearchTextChange,
  onDownloadTemplate,
  onDownloadPriceUpdateTemplate,
  onTriggerImport,
  onTriggerPriceUpdate,
  onDownloadOpeningTemplate,
  onTriggerOpeningImport,
  importing,
  importTarget,
  importMode,
  openingImporting,
  openingImportTarget,
  showSensitiveInfo = false,
  productCostFilterActive = false,
  priceCostMatchedCount = 0,
  missingAvgCostCount = 0,
  onToggleProductCostFilter,
  onOpenAvgCostPreview,
  exportConfig,
  dataSource,
  columns,
  onFileChange,
  fileInputRef,
  onOpeningFileChange,
  openingFileInputRef,
}) => {
  if (tabKey !== activeKey) return null;

  return (
    <>
      <div className="action-row">
        {tabKey !== 'units' && (
          <CatalogSearchInput
            tabKey={tabKey}
            searchText={searchText}
            onSearchTextChange={onSearchTextChange}
          />
        )}
        <div className="export-actions" style={{ marginLeft: 'auto' }}>
          {tabKey === 'products' && (
            <>
              {showSensitiveInfo && (
                <>
                  <Button
                    size="large"
                    type={productCostFilterActive ? 'primary' : 'default'}
                    onClick={onToggleProductCostFilter}
                  >
                    {productCostFilterActive
                      ? 'Bỏ lọc giá lẻ = giá vốn'
                      : `Lọc giá lẻ = giá vốn (${priceCostMatchedCount})`}
                  </Button>
                  <Button
                    size="large"
                    onClick={onOpenAvgCostPreview}
                    disabled={!missingAvgCostCount}
                  >
                    Điền Giá vốn từ giá lẻ ({missingAvgCostCount})
                  </Button>
                </>
              )}
              <Button
                size="large"
                onClick={() => onDownloadPriceUpdateTemplate?.(tabKey)}
              >
                Tải file giá
              </Button>
              <Button
                size="large"
                onClick={() => onTriggerPriceUpdate?.(tabKey)}
                loading={
                  importing &&
                  importTarget === tabKey &&
                  importMode === 'price-update'
                }
              >
                Cập nhật giá Excel
              </Button>
            </>
          )}
          {(tabKey === 'customers' || tabKey === 'suppliers') && (
            <>
              <Button
                size="large"
                onClick={() => onDownloadOpeningTemplate?.(tabKey)}
              >
                Tải mẫu đầu kỳ
              </Button>
              <Button
                size="large"
                onClick={() => onTriggerOpeningImport?.(tabKey)}
                loading={openingImporting && openingImportTarget === tabKey}
              >
                Nhập đầu kỳ
              </Button>
            </>
          )}
          <Button size="large" onClick={() => onDownloadTemplate(tabKey)}>
            Tải mẫu Excel
          </Button>
          <Button
            size="large"
            onClick={() => onTriggerImport(tabKey)}
            loading={
              importing && importTarget === tabKey && importMode === 'catalog'
            }
          >
            Nhập Excel
          </Button>
          <ExportActions
            rows={exportConfig.rows}
            fileName={exportConfig.fileName}
            sheetName={exportConfig.sheetName}
            title={exportConfig.title}
          />
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx,.xls"
          style={{ display: 'none' }}
          onChange={onFileChange}
        />
        <input
          ref={openingFileInputRef}
          type="file"
          accept=".xlsx,.xls"
          style={{ display: 'none' }}
          onChange={onOpeningFileChange}
        />
      </div>

      <div className="table-wrapper">
        <Table
          rowKey="id"
          dataSource={dataSource}
          columns={columns}
          pagination={buildPaginationConfig(tabKey)}
          scroll={{ x: 1100 }}
        />
      </div>
    </>
  );
};

export default CatalogTabContent;
