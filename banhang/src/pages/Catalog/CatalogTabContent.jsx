import { Button, Input, Table } from 'antd';
import ExportActions from '../../components/ExportActions.jsx';

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
          <Input
            allowClear
            placeholder="Tìm kiếm..."
            value={searchText}
            onChange={(event) => onSearchTextChange(event.target.value)}
            style={{ maxWidth: 360 }}
          />
        )}
        <div className="export-actions" style={{ marginLeft: 'auto' }}>
          {tabKey === 'products' && (
            <>
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
          pagination={tabKey === 'units' ? { pageSize: 8 } : false}
          scroll={{ x: 1100 }}
        />
      </div>
    </>
  );
};

export default CatalogTabContent;
