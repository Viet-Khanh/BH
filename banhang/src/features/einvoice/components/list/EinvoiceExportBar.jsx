import { Button, Select, Space } from 'antd';
import { PROFILES } from '../../profiles/index.js';

const PROFILE_OPTIONS = PROFILES.map((profile) => ({
  value: profile.id,
  label: profile.name,
}));

const EinvoiceExportBar = ({
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
      style={{ width: 280 }}
      value={profileId}
      options={PROFILE_OPTIONS}
      onChange={onProfileChange}
    />
    <Button
      type="primary"
      disabled={disabled || !selectedCount}
      loading={exporting}
      onClick={onExport}
    >
      Xuất file ({selectedCount} hoá đơn)
    </Button>
  </Space>
);

export default EinvoiceExportBar;
