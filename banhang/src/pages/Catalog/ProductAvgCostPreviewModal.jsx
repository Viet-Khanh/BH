import { Modal, Table } from 'antd';
import { formatMoney } from '../../utils/moneyFormat.js';

const columns = [
  { title: 'Mã hàng', dataIndex: 'code', width: 140 },
  { title: 'Tên hàng', dataIndex: 'name' },
  {
    title: 'Giá vốn hiện tại',
    dataIndex: 'avgCost',
    width: 160,
    align: 'right',
    render: (value) => formatMoney(value),
  },
  {
    title: 'Đơn giá lẻ',
    dataIndex: 'sellPriceDefault',
    width: 160,
    align: 'right',
    render: (value) => formatMoney(value),
  },
  {
    title: 'Giá vốn mới',
    dataIndex: 'sellPriceDefault',
    width: 160,
    align: 'right',
    render: (value) => formatMoney(value),
  },
];

const ProductAvgCostPreviewModal = ({
  open,
  products,
  onCancel,
  onConfirm,
  confirmLoading,
}) => (
  <Modal
    title="Xác nhận cập nhật Giá vốn"
    open={open}
    onCancel={onCancel}
    onOk={onConfirm}
    okText="Cập nhật"
    cancelText="Hủy"
    confirmLoading={confirmLoading}
    width={900}
  >
    <Table
      size="small"
      bordered
      rowKey="id"
      dataSource={products}
      columns={columns}
      pagination={{ pageSize: 8 }}
      scroll={{ x: 760, y: 360 }}
    />
  </Modal>
);

export default ProductAvgCostPreviewModal;
