import { Table, Tag, Typography } from 'antd';
import dayjs from 'dayjs';
import { formatMoney } from '../../../../utils/moneyFormat.js';
import { getStatusOption } from '../../domain/statusLabels.js';
import EinvoiceRowActions from './EinvoiceRowActions.jsx';

const ISSUE_TYPE = { error: 'danger', warning: 'warning' };

const buyerName = ({ buyer }) => buyer.companyName || buyer.name || 'Khách lẻ';

const StatusCell = ({ item }) => {
  const option = getStatusOption(item.status);
  return (
    <>
      <Tag color={option.color}>{option.label}</Tag>
      {item.deleted && <Tag color="red">Đã xoá</Tag>}
      {item.einvoice?.number && <div>Số: {item.einvoice.number}</div>}
    </>
  );
};

const IssuesCell = ({ issues }) =>
  issues.map((issue) => (
    <Typography.Text
      key={issue.message}
      type={ISSUE_TYPE[issue.level]}
      style={{ display: 'block' }}
    >
      {issue.message}
    </Typography.Text>
  ));

const buildColumns = (onChanged) => [
  { title: 'Mã HĐ', dataIndex: 'code' },
  {
    title: 'Ngày',
    render: (item) => dayjs(item.date).format('DD/MM/YYYY HH:mm'),
  },
  { title: 'Khách', render: (item) => buyerName(item.document) },
  { title: 'MST', render: (item) => item.document.buyer.taxCode },
  {
    title: 'Tổng tiền',
    align: 'right',
    render: (item) => formatMoney(item.document.totals.total),
  },
  { title: 'HTTT', render: (item) => item.document.paymentMethod },
  { title: 'Trạng thái', render: (item) => <StatusCell item={item} /> },
  {
    title: 'Cần kiểm tra',
    render: (item) => <IssuesCell issues={item.issues} />,
  },
  {
    title: '',
    render: (item) => (
      // Buttons must not also open the detail drawer.
      <span onClick={(event) => event.stopPropagation()}>
        <EinvoiceRowActions item={item} onChanged={onChanged} />
      </span>
    ),
  },
];

// Only invoices not yet exported can be selected; exported ones must be
// unmarked first so a sale is never uploaded twice by accident.
const EinvoiceTable = ({
  items,
  loading,
  selectedIds,
  onSelect,
  onChanged,
  onOpen,
}) => (
  <Table
    rowKey="invoiceId"
    size="middle"
    loading={loading}
    dataSource={items}
    columns={buildColumns(onChanged)}
    pagination={{ pageSize: 50, hideOnSinglePage: true }}
    onRow={(item) => ({
      // Clicks on the selection checkbox only select the row.
      onClick: (event) =>
        event.target.closest?.('.ant-table-selection-column') || onOpen(item),
      style: { cursor: 'pointer' },
    })}
    rowSelection={{
      selectedRowKeys: selectedIds,
      onChange: onSelect,
      getCheckboxProps: (item) => ({ disabled: item.status !== 'pending' }),
    }}
  />
);

export default EinvoiceTable;
