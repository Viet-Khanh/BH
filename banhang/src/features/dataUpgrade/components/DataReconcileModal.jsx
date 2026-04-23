import { Alert, Button, Descriptions, Modal, Space, Table } from 'antd';
import { formatMoney } from '../../../utils/moneyFormat.js';

const formatNumber = (value) => Number(value || 0).toLocaleString('vi-VN');

const stockColumns = [
  {
    title: 'Sản phẩm',
    dataIndex: 'name',
    render: (value, row) => `${row.code ? `${row.code} - ` : ''}${value}`,
  },
  {
    title: 'Snapshot',
    dataIndex: 'snapshotStock',
    align: 'right',
    render: (value, row) => `${formatNumber(value)} ${row.unit || ''}`,
  },
  {
    title: 'Tính lại',
    dataIndex: 'computedStock',
    align: 'right',
    render: (value, row) => `${formatNumber(value)} ${row.unit || ''}`,
  },
  {
    title: 'Lệch',
    dataIndex: 'diff',
    align: 'right',
    render: (value, row) => `${formatNumber(value)} ${row.unit || ''}`,
  },
];

const debtColumns = [
  {
    title: 'Khách hàng',
    dataIndex: 'name',
    render: (value, row) => `${value}${row.phone ? ` - ${row.phone}` : ''}`,
  },
  {
    title: 'Snapshot',
    dataIndex: 'snapshotDebt',
    align: 'right',
    render: formatMoney,
  },
  {
    title: 'Tính lại',
    dataIndex: 'computedDebt',
    align: 'right',
    render: formatMoney,
  },
  {
    title: 'Lệch',
    dataIndex: 'diff',
    align: 'right',
    render: formatMoney,
  },
];

const SummaryBlock = ({ title, data = {}, money = false }) => (
  <>
    <div className="section-title">{title}</div>
    <Descriptions bordered size="small" column={4}>
      <Descriptions.Item label="Đã kiểm tra">
        {formatNumber(data.checked)}
      </Descriptions.Item>
      <Descriptions.Item label="Khớp">
        {formatNumber(data.matched)}
      </Descriptions.Item>
      <Descriptions.Item label="Lệch">
        {formatNumber(data.mismatched)}
      </Descriptions.Item>
      <Descriptions.Item label="Tổng lệch">
        {money ? formatMoney(data.totalDiff) : formatNumber(data.totalDiff)}
      </Descriptions.Item>
    </Descriptions>
  </>
);

const DataReconcileModal = ({
  open,
  report,
  loading,
  syncing,
  onCancel,
  onResync,
}) => {
  const stock = report?.stock || {};
  const debt = report?.debt || {};
  const hasMismatch =
    Number(stock.mismatched || 0) > 0 || Number(debt.mismatched || 0) > 0;

  return (
    <Modal
      title="Đối soát tồn kho và công nợ"
      open={open}
      onCancel={onCancel}
      footer={
        <Space>
          <Button onClick={onCancel}>Đóng</Button>
          {hasMismatch ? (
            <Button danger type="primary" loading={syncing} onClick={onResync}>
              Đồng bộ lại theo lịch sử
            </Button>
          ) : null}
        </Space>
      }
      width={920}
    >
      <Alert
        type={hasMismatch ? 'warning' : 'success'}
        showIcon
        message={
          hasMismatch
            ? 'Có số liệu lệch giữa snapshot và cách tính lại từ lịch sử.'
            : 'Snapshot đang khớp với cách tính lại từ lịch sử.'
        }
        style={{ marginBottom: 12 }}
      />

      <SummaryBlock title="Tồn kho" data={stock} />
      <Table
        rowKey="productId"
        size="small"
        loading={loading}
        columns={stockColumns}
        dataSource={stock.rows || []}
        pagination={{ pageSize: 5 }}
        style={{ marginTop: 10, marginBottom: 16 }}
      />

      <SummaryBlock title="Công nợ khách" data={debt} money />
      <Table
        rowKey="customerId"
        size="small"
        loading={loading}
        columns={debtColumns}
        dataSource={debt.rows || []}
        pagination={{ pageSize: 5 }}
        style={{ marginTop: 10 }}
      />
    </Modal>
  );
};

export default DataReconcileModal;
