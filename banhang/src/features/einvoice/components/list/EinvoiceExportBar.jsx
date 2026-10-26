import { Button, Select, Space } from 'antd';

const LABELS = {
  issue: 'Xuất file',
  adjust: 'Xuất file điều chỉnh/thay thế',
};

const EinvoiceExportBar = ({
  purpose,
  profileOptions,
  profileId,
  onProfileChange,
  selectedCount,
  disabled,
  exporting,
  onExport,
}) => (
  <Space wrap>
    <span>Mẫu file:</span>
    <Select
      style={{ width: 300 }}
      value={profileId}
      options={profileOptions}
      onChange={onProfileChange}
    />
    <Button
      type="primary"
      disabled={disabled || !selectedCount}
      loading={exporting}
      onClick={onExport}
    >
      {LABELS[purpose]} ({selectedCount} hoá đơn)
    </Button>
  </Space>
);

export default EinvoiceExportBar;
