import { Alert, Table, Tag, Typography } from 'antd';
import {
  fieldLabel,
  formatFieldValue,
  hasDiff,
  lineChangeType,
} from '../../domain/diffLabels.js';

const changeColumns = [
  { title: 'Mục', render: (change) => fieldLabel(change.field) },
  {
    title: 'Lúc xuất',
    render: (change) => formatFieldValue(change.field, change.before),
  },
  {
    title: 'Hiện tại',
    render: (change) => formatFieldValue(change.field, change.after),
  },
];

const ChangeTable = ({ title, changes }) =>
  changes.length ? (
    <>
      <Typography.Title level={5}>{title}</Typography.Title>
      <Table
        size="small"
        rowKey="field"
        pagination={false}
        dataSource={changes}
        columns={changeColumns}
      />
    </>
  ) : null;

const LineChange = ({ change }) => {
  const type = lineChangeType(change.type);
  const line = change.after || change.before;
  return (
    <div style={{ marginBottom: 8 }}>
      <Tag color={type.color}>{type.label}</Tag>
      <Typography.Text delete={change.type === 'removed'}>
        {line.name} — {line.quantity} {line.unit} ×{' '}
        {formatFieldValue('unitPrice', line.unitPrice)}
      </Typography.Text>
      {(change.fields || []).map((field) => (
        <div key={field.field} style={{ paddingLeft: 16 }}>
          {fieldLabel(field.field)}:{' '}
          {formatFieldValue(field.field, field.before)} →{' '}
          <strong>{formatFieldValue(field.field, field.after)}</strong>
        </div>
      ))}
    </div>
  );
};

// "Before / after" of an invoice changed after its e-invoice was exported.
const DiffView = ({ diff }) => {
  if (!diff)
    return (
      <Alert
        type="info"
        showIcon
        message="Hoá đơn được xuất trước khi app lưu bản chụp nên không so sánh được chi tiết."
      />
    );
  if (!hasDiff(diff))
    return <Alert type="info" showIcon message="Nội dung không đổi." />;
  const header = diff.date ? [{ field: 'date', ...diff.date }] : [];
  return (
    <>
      {diff.deleted && (
        <Alert
          type="error"
          showIcon
          message="Đơn bán đã bị xoá sau khi xuất HĐĐT: cần điều chỉnh giảm toàn bộ hoá đơn."
          style={{ marginBottom: 12 }}
        />
      )}
      <ChangeTable title="Thông tin chung" changes={header} />
      <ChangeTable title="Người mua" changes={diff.buyer} />
      {diff.lines.length > 0 && (
        <Typography.Title level={5}>Dòng hàng</Typography.Title>
      )}
      {diff.lines.map((change, index) => (
        <LineChange key={index} change={change} />
      ))}
      <ChangeTable title="Tổng tiền" changes={diff.totals} />
    </>
  );
};

export default DiffView;
