import { InputNumber, Select, Tag } from 'antd';
import { formatMoney } from '../../../utils/moneyFormat.js';
import { getUnitOptions } from '../../../utils/productUnits.js';
import { MAX_LABELS_PER_ROW } from '../labels/labelRows.js';

const renderName = (name, row) => (
  <>
    <div>{name}</div>
    {row.warning && <Tag color="warning">{row.warning}</Tag>}
  </>
);

const renderUnit = (row, onUnitChange) => {
  const options = getUnitOptions(row.product);
  if (options.length < 2) return row.unitLabel;
  return (
    <Select
      size="small"
      style={{ minWidth: 120 }}
      value={row.unitName}
      options={options}
      onChange={(value) => onUnitChange(row.key, value)}
    />
  );
};

// Columns of the label confirm list.
export const getLabelPrintColumns = ({ onUnitChange, onCountChange }) => [
  { title: 'Tên hàng', dataIndex: 'name', render: renderName },
  {
    title: 'ĐVT',
    key: 'unit',
    width: 150,
    render: (_, row) => renderUnit(row, onUnitChange),
  },
  {
    title: 'Giá',
    dataIndex: 'price',
    width: 110,
    align: 'right',
    render: (price) => formatMoney(price),
  },
  {
    title: 'Mã vạch',
    dataIndex: 'barcode',
    width: 150,
    render: (barcode) => barcode || '—',
  },
  {
    title: 'Số tem',
    dataIndex: 'count',
    width: 110,
    render: (count, row) => (
      <InputNumber
        size="small"
        min={0}
        max={MAX_LABELS_PER_ROW}
        precision={0}
        value={count}
        onChange={(value) => onCountChange(row.key, value)}
      />
    ),
  },
];
