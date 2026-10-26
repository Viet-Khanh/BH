import { Button, Checkbox, Input, Select, Space, Table } from 'antd';
import { FIELD_GROUPS, formatOptions } from '../../domain/fields/index.js';
import {
  addColumn,
  moveColumn,
  removeColumn,
  updateColumn,
} from '../../domain/profileDraft.js';

const FIELD_OPTIONS = FIELD_GROUPS.map((group) => ({
  label: group.label,
  options: group.fields.map((field) => ({
    value: field.key,
    label: field.label,
  })),
}));

// Column list of a profile: header text, source field, format/constant, order.
const ColumnsEditor = ({ columns, onChange }) => {
  const patch = (index, value) => onChange(updateColumn(columns, index, value));
  const tableColumns = [
    { title: '#', width: 44, render: (_, __, index) => index + 1 },
    {
      title: 'Tiêu đề cột',
      render: (column, _, index) => (
        <Input
          value={column.header}
          onChange={(event) => patch(index, { header: event.target.value })}
        />
      ),
    },
    {
      title: 'Lấy dữ liệu từ',
      width: 260,
      render: (column, _, index) => (
        <Select
          showSearch
          optionFilterProp="label"
          style={{ width: '100%' }}
          value={column.field}
          options={FIELD_OPTIONS}
          onChange={(field) => patch(index, { field })}
        />
      ),
    },
    {
      title: 'Định dạng / giá trị',
      width: 220,
      render: (column, _, index) =>
        column.field === 'constant' ? (
          <Input
            value={column.constant}
            placeholder={column.prompt || 'Giá trị'}
            onChange={(event) => patch(index, { constant: event.target.value })}
          />
        ) : formatOptions(column.field).length ? (
          <Select
            style={{ width: '100%' }}
            value={column.format || formatOptions(column.field)[0].value}
            options={formatOptions(column.field)}
            onChange={(format) => patch(index, { format })}
          />
        ) : null,
    },
    {
      title: 'Chỉ dòng đầu HĐ',
      width: 90,
      render: (column, _, index) => (
        <Checkbox
          checked={Boolean(column.firstLineOnly)}
          onChange={(event) =>
            patch(index, { firstLineOnly: event.target.checked })
          }
        />
      ),
    },
    {
      title: '',
      width: 130,
      render: (_, __, index) => (
        <Space size={4}>
          <Button
            size="small"
            onClick={() => onChange(moveColumn(columns, index, -1))}
          >
            ↑
          </Button>
          <Button
            size="small"
            onClick={() => onChange(moveColumn(columns, index, 1))}
          >
            ↓
          </Button>
          <Button
            size="small"
            danger
            onClick={() => onChange(removeColumn(columns, index))}
          >
            Xoá
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <>
      <Table
        size="small"
        rowKey={(_, index) => index}
        pagination={false}
        dataSource={columns}
        columns={tableColumns}
      />
      <Button
        style={{ marginTop: 8 }}
        onClick={() => onChange(addColumn(columns))}
      >
        Thêm cột
      </Button>
    </>
  );
};

export default ColumnsEditor;
