import { Button, Input, Table } from 'antd';
import ExportActions from '../../components/ExportActions.jsx';

const CatalogTabContent = ({
  tabKey,
  activeKey,
  searchText,
  onSearchTextChange,
  onDownloadTemplate,
  onTriggerImport,
  importing,
  importTarget,
  exportConfig,
  dataSource,
  columns,
  onFileChange,
  fileInputRef,
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
          <Button size="large" onClick={() => onDownloadTemplate(tabKey)}>
            Tải mẫu Excel
          </Button>
          <Button
            size="large"
            onClick={() => onTriggerImport(tabKey)}
            loading={importing && importTarget === tabKey}
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
