import { Descriptions, Table } from 'antd';
import dayjs from 'dayjs';
import { formatMoney } from '../../../../utils/moneyFormat.js';
import { formatVatRate } from '../../domain/vatRates.js';

const lineColumns = (deduction) => [
  { title: 'STT', dataIndex: 'index', width: 50 },
  { title: 'Tên hàng', dataIndex: 'name' },
  { title: 'ĐVT', dataIndex: 'unit', width: 70 },
  { title: 'SL', dataIndex: 'quantity', align: 'right', width: 70 },
  {
    title: 'Đơn giá',
    align: 'right',
    render: (line) => formatMoney(line.unitPrice),
  },
  ...(deduction
    ? [
        { title: 'TS', render: (line) => formatVatRate(line.vatRate) },
        {
          title: 'Thuế',
          align: 'right',
          render: (line) => formatMoney(line.tax),
        },
      ]
    : []),
  {
    title: 'Thành tiền',
    align: 'right',
    render: (line) => formatMoney(line.amount),
  },
];

// Read-only view of a backend e-invoice document.
const DocumentView = ({ document: doc }) => {
  const deduction = doc.taxMethod === 'deduction';
  const { buyer, totals } = doc;
  return (
    <>
      <Descriptions size="small" column={1} bordered>
        <Descriptions.Item label="Ngày">
          {dayjs(doc.date).format('DD/MM/YYYY HH:mm')}
        </Descriptions.Item>
        <Descriptions.Item label="Người mua">
          {buyer.name || '—'}
        </Descriptions.Item>
        {buyer.companyName && (
          <Descriptions.Item label="Đơn vị">
            {buyer.companyName}
          </Descriptions.Item>
        )}
        <Descriptions.Item label="MST">
          {buyer.taxCode || '—'}
        </Descriptions.Item>
        <Descriptions.Item label="Địa chỉ">
          {buyer.address || '—'}
        </Descriptions.Item>
        <Descriptions.Item label="Email">
          {buyer.email || '—'}
        </Descriptions.Item>
        <Descriptions.Item label="Hình thức TT">
          {doc.paymentMethod}
        </Descriptions.Item>
      </Descriptions>
      <Table
        style={{ marginTop: 12 }}
        size="small"
        rowKey="index"
        pagination={false}
        dataSource={doc.lines}
        columns={lineColumns(deduction)}
      />
      <Descriptions size="small" column={1} style={{ marginTop: 12 }}>
        {doc.discount > 0 && (
          <Descriptions.Item label="Chiết khấu">
            {formatMoney(doc.discount)}
          </Descriptions.Item>
        )}
        {deduction && (
          <Descriptions.Item label="Tiền trước thuế">
            {formatMoney(totals.beforeTax)}
          </Descriptions.Item>
        )}
        {deduction && (
          <Descriptions.Item label="Tiền thuế">
            {formatMoney(totals.tax)}
          </Descriptions.Item>
        )}
        <Descriptions.Item label="Tổng tiền">
          <strong>{formatMoney(totals.total)}</strong>
        </Descriptions.Item>
      </Descriptions>
    </>
  );
};

export default DocumentView;
