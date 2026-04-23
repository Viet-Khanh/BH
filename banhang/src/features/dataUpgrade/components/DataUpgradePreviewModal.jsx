import { Descriptions, List, Modal } from 'antd';
import { formatMoney } from '../../../utils/moneyFormat.js';

const formatCount = (value) => Number(value || 0).toLocaleString('vi-VN');

const SummaryDescriptions = ({ summary = {} }) => (
  <Descriptions bordered column={2} size="small">
    <Descriptions.Item label="Sản phẩm">
      {formatCount(summary.productCount)}
    </Descriptions.Item>
    <Descriptions.Item label="Khách hàng">
      {formatCount(summary.customerCount)}
    </Descriptions.Item>
    <Descriptions.Item label="Tồn âm">
      {formatCount(summary.negativeStockCount)}
    </Descriptions.Item>
    <Descriptions.Item label="Khách còn nợ">
      {formatCount(summary.debtorCount)}
    </Descriptions.Item>
    <Descriptions.Item label="Khách dư tiền">
      {formatCount(summary.customerCreditCount)}
    </Descriptions.Item>
    <Descriptions.Item label="Tổng nợ">
      {formatMoney(summary.totalDebt)}
    </Descriptions.Item>
    <Descriptions.Item label="Tổng tiền dư">
      {formatMoney(summary.totalCredit)}
    </Descriptions.Item>
    <Descriptions.Item label="Công nợ thuần">
      {formatMoney(summary.netDebt)}
    </Descriptions.Item>
  </Descriptions>
);

const PreviewList = ({ title, items = [], renderItem }) => {
  if (!items.length) return null;
  return (
    <>
      <div className="section-title">{title}</div>
      <List
        size="small"
        bordered
        dataSource={items.slice(0, 5)}
        renderItem={(item) => <List.Item>{renderItem(item)}</List.Item>}
      />
    </>
  );
};

const DataUpgradePreviewModal = ({
  open,
  preview,
  loading,
  committing,
  onCancel,
  onCommit,
}) => {
  const summary = preview?.summary || {};

  return (
    <Modal
      title="Kiểm tra đồng bộ tồn kho và công nợ"
      open={open}
      onCancel={onCancel}
      onOk={onCommit}
      okText="Xác nhận đồng bộ"
      cancelText="Đóng"
      confirmLoading={committing}
      okButtonProps={{ disabled: !preview || loading }}
      width={760}
    >
      <SummaryDescriptions summary={summary} />
      <PreviewList
        title="Sản phẩm tồn âm cần chú ý"
        items={preview?.negativeStockProducts}
        renderItem={(item) =>
          `${item.code ? `${item.code} - ` : ''}${item.name}: ${formatCount(
            item.stock
          )} ${item.unit || ''}`
        }
      />
      <PreviewList
        title="Top khách còn nợ"
        items={preview?.debtorCustomers}
        renderItem={(item) =>
          `${item.name}${item.phone ? ` - ${item.phone}` : ''}: ${formatMoney(
            item.debt
          )}`
        }
      />
      <PreviewList
        title="Khách đang dư tiền/ứng trước"
        items={preview?.creditCustomers}
        renderItem={(item) =>
          `${item.name}${item.phone ? ` - ${item.phone}` : ''}: ${formatMoney(
            Math.abs(Number(item.debt || 0))
          )}`
        }
      />
    </Modal>
  );
};

export default DataUpgradePreviewModal;
