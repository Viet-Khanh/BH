import { Button, DatePicker, Input, Select, Space } from 'antd';
import { STATUS_OPTIONS } from '../domain/statusLabels.js';

const EinvoiceFilters = ({ filters, onChange, onReload, loading }) => (
  <Space wrap>
    <DatePicker.RangePicker
      value={filters.range}
      format="DD/MM/YYYY"
      allowClear={false}
      onChange={(range) => range && onChange({ range })}
    />
    <Select
      style={{ width: 180 }}
      value={filters.status}
      options={STATUS_OPTIONS}
      onChange={(status) => onChange({ status })}
    />
    <Input.Search
      allowClear
      placeholder="Mã HĐ, khách, MST"
      defaultValue={filters.search}
      onSearch={(search) => onChange({ search })}
      style={{ width: 240 }}
    />
    <Button onClick={onReload} loading={loading}>
      Tải lại
    </Button>
  </Space>
);

export default EinvoiceFilters;
