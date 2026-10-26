import { Button, Checkbox, DatePicker, Input, Select, Space } from 'antd';
import { FILTER_OPTIONS } from '../../domain/statusLabels.js';

const EinvoiceFilters = ({ filters, onChange, onReload, loading }) => (
  <Space wrap>
    <DatePicker.RangePicker
      value={filters.range}
      format="DD/MM/YYYY"
      allowClear={false}
      onChange={(range) => range && onChange({ range })}
    />
    <Select
      style={{ width: 220 }}
      value={filters.status}
      options={FILTER_OPTIONS}
      onChange={(status) => onChange({ status })}
    />
    <Input.Search
      allowClear
      placeholder="Mã HĐ, khách, MST"
      defaultValue={filters.search}
      onSearch={(search) => onChange({ search })}
      style={{ width: 240 }}
    />
    <Checkbox
      checked={filters.requestedOnly}
      onChange={(event) => onChange({ requestedOnly: event.target.checked })}
    >
      Chỉ hoá đơn khách lấy HĐ
    </Checkbox>
    <Button onClick={onReload} loading={loading}>
      Tải lại
    </Button>
  </Space>
);

export default EinvoiceFilters;
