import { Alert, Descriptions, Modal, Table, Tag } from 'antd';
import { formatMoney } from '../../utils/moneyFormat.js';
import {
  canCommitOpeningImport,
  getOpeningImportTargetLabel,
} from './openingImportUtils.js';

const formatIssueField = (field) => {
  if (field === 'name') return 'Tên';
  if (field === 'phone') return 'Số điện thoại';
  if (field === 'address') return 'Địa chỉ';
  if (field === 'openingBalance') return 'Công nợ đầu kỳ';
  return 'Tổng quát';
};

const formatSignedMoney = (value) => {
  const numeric = Number(value || 0);
  if (numeric < 0) return `- ${formatMoney(Math.abs(numeric))}`;
  return formatMoney(numeric);
};

const buildIssueRows = (issues = []) =>
  issues.map((issue, index) => ({
    key: `${issue.code || 'issue'}-${issue.rowNumber || 'global'}-${index}`,
    rowNumber: issue.rowNumber,
    field: issue.field,
    message: issue.message,
  }));

const buildValidRows = (rows = []) =>
  rows.map((row) => ({
    key: `valid-${row.rowNumber}`,
    rowNumber: row.rowNumber,
    name: row.name || '',
    phone: row.phone || '',
    address: row.address || '',
    openingBalance: Number(row.openingBalance || 0),
  }));

const getBalanceStatusMeta = (openingBalance) => {
  if (openingBalance > 0) {
    return {
      color: 'red',
      label: 'Nợ dương',
    };
  }

  if (openingBalance < 0) {
    return {
      color: 'gold',
      label: 'Số dư âm',
    };
  }

  return {
    color: 'default',
    label: 'Không phát sinh',
  };
};

const issueColumns = [
  {
    title: 'Dòng',
    dataIndex: 'rowNumber',
    width: 90,
    render: (value) => value || 'Tổng quát',
  },
  {
    title: 'Trường',
    dataIndex: 'field',
    width: 160,
    render: (value) => formatIssueField(value),
  },
  {
    title: 'Nội dung',
    dataIndex: 'message',
  },
];

const OpeningImportPreviewModal = ({
  open,
  previewResult,
  onCancel,
  onConfirm,
  confirmLoading,
}) => {
  const summary = previewResult?.summary || {};
  const targetLabel = previewResult?.target
    ? getOpeningImportTargetLabel(previewResult.target)
    : 'dữ liệu';
  const errors = buildIssueRows(previewResult?.errors || []);
  const warnings = buildIssueRows(previewResult?.warnings || []);
  const validRows = buildValidRows(previewResult?.normalizedRows || []);
  const canCommit = canCommitOpeningImport(previewResult);
  const validColumns = [
    {
      title: 'Dòng',
      dataIndex: 'rowNumber',
      width: 90,
    },
    {
      title: `Tên ${targetLabel}`,
      dataIndex: 'name',
      width: 220,
    },
    {
      title: 'Số điện thoại',
      dataIndex: 'phone',
      width: 140,
      render: (value) => value || '-',
    },
    {
      title: 'Địa chỉ',
      dataIndex: 'address',
      render: (value) => value || '-',
    },
    {
      title: 'Công nợ đầu kỳ',
      dataIndex: 'openingBalance',
      width: 160,
      align: 'right',
      render: (value) => formatSignedMoney(value),
    },
    {
      title: 'Trạng thái',
      dataIndex: 'openingBalance',
      width: 140,
      render: (value) => {
        const meta = getBalanceStatusMeta(value);
        return <Tag color={meta.color}>{meta.label}</Tag>;
      },
    },
  ];

  return (
    <Modal
      title={`Kiểm tra import đầu kỳ ${targetLabel}`}
      open={open}
      onCancel={onCancel}
      onOk={onConfirm}
      okText="Xác nhận nhập"
      cancelText="Đóng"
      okButtonProps={{ disabled: !canCommit }}
      confirmLoading={confirmLoading}
      width={960}
    >
      {previewResult && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {errors.length > 0 ? (
            <Alert
              type="error"
              message="File chưa thể nhập. Cần xử lý hết lỗi trước khi xác nhận."
              showIcon
            />
          ) : warnings.length > 0 ? (
            <Alert
              type="warning"
              message="File hợp lệ nhưng có cảnh báo. Anh nên kiểm tra lại trước khi nhập."
              showIcon
            />
          ) : (
            <Alert
              type="success"
              message="File hợp lệ. Có thể xác nhận nhập dữ liệu."
              showIcon
            />
          )}

          <Descriptions size="small" bordered column={2}>
            <Descriptions.Item label="Tổng dòng file">
              {summary.totalRows || 0}
            </Descriptions.Item>
            <Descriptions.Item label="Dòng hợp lệ">
              {summary.validRows || 0}
            </Descriptions.Item>
            <Descriptions.Item label="Số lỗi">
              {summary.errorCount || 0}
            </Descriptions.Item>
            <Descriptions.Item label="Số cảnh báo">
              {summary.warningCount || 0}
            </Descriptions.Item>
            <Descriptions.Item label="Công nợ dương">
              {formatSignedMoney(summary.totalPositiveBalance || 0)}
            </Descriptions.Item>
            <Descriptions.Item label="Số dư âm">
              {formatSignedMoney(summary.totalNegativeBalance || 0)}
            </Descriptions.Item>
            <Descriptions.Item label="Tổng thuần">
              {formatSignedMoney(summary.netBalance || 0)}
            </Descriptions.Item>
            <Descriptions.Item label="Dòng không phát sinh">
              {summary.zeroCount || 0}
            </Descriptions.Item>
          </Descriptions>

          {validRows.length > 0 && (
            <Table
              title={() => 'Danh sách hợp lệ sẽ được nhập'}
              size="small"
              bordered
              pagination={{ pageSize: 5 }}
              dataSource={validRows}
              columns={validColumns}
              scroll={{ x: 900, y: 260 }}
            />
          )}

          {errors.length > 0 && (
            <Table
              size="small"
              bordered
              pagination={{ pageSize: 5 }}
              dataSource={errors}
              columns={issueColumns}
              scroll={{ y: 220 }}
            />
          )}

          {warnings.length > 0 && (
            <Table
              size="small"
              bordered
              pagination={{ pageSize: 5 }}
              dataSource={warnings}
              columns={issueColumns}
              scroll={{ y: 220 }}
            />
          )}
        </div>
      )}
    </Modal>
  );
};

export default OpeningImportPreviewModal;
