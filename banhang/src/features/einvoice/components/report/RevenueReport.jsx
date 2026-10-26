import { Button, DatePicker, Select, Space, Table, Typography } from 'antd';
import { formatMoney } from '../../../../utils/moneyFormat.js';
import { periodLabel } from '../../domain/reportExport.js';
import { formatVatRate } from '../../domain/vatRates.js';
import { useEinvoiceReport } from '../../hooks/useEinvoiceReport.js';

const GROUP_OPTIONS = [
  { value: 'month', label: 'Theo tháng' },
  { value: 'quarter', label: 'Theo quý' },
];

const money = (value) => formatMoney(value);

const columns = [
  { title: 'Kỳ', render: (row) => row.label || periodLabel(row.period) },
  { title: 'Số HĐ', dataIndex: 'invoiceCount', align: 'right' },
  { title: 'Doanh thu', align: 'right', render: (row) => money(row.total) },
  {
    title: 'Đã xuất HĐĐT',
    align: 'right',
    render: (row) => `${money(row.exportedTotal)} (${row.exportedCount})`,
  },
  {
    title: 'Chưa xuất',
    align: 'right',
    render: (row) => `${money(row.pendingTotal)} (${row.pendingCount})`,
  },
];

const RateTable = ({ rates }) => (
  <Table
    size="small"
    rowKey="rate"
    pagination={false}
    dataSource={rates}
    columns={[
      { title: 'Thuế suất', render: (rate) => formatVatRate(rate.rate) },
      {
        title: 'Tiền trước thuế',
        align: 'right',
        render: (rate) => money(rate.beforeTax),
      },
      { title: 'Tiền thuế', align: 'right', render: (rate) => money(rate.tax) },
      {
        title: 'Tổng cộng',
        align: 'right',
        render: (rate) => money(rate.total),
      },
    ]}
  />
);

const HELP =
  'Số liệu tham khảo để kê khai thuế: doanh thu bán hàng theo kỳ, phần đã/chưa xuất hoá đơn điện tử. App không tính số thuế phải nộp.';

// "Báo cáo" tab: revenue per period for the shop's tax declaration.
const RevenueReport = () => {
  const { filters, updateFilters, report, loading, exportExcel } =
    useEinvoiceReport();
  const deduction = report?.taxMethod === 'deduction';
  const rows = report
    ? [...report.rows, { ...report.totals, period: 'total', label: 'Tổng' }]
    : [];

  return (
    <Space direction="vertical" size="middle" style={{ width: '100%' }}>
      <Typography.Text type="secondary">{HELP}</Typography.Text>
      <Space wrap>
        <DatePicker.RangePicker
          value={filters.range}
          format="DD/MM/YYYY"
          allowClear={false}
          onChange={(range) => range && updateFilters({ range })}
        />
        <Select
          style={{ width: 140 }}
          value={filters.groupBy}
          options={GROUP_OPTIONS}
          onChange={(groupBy) => updateFilters({ groupBy })}
        />
        <Button disabled={!report} onClick={exportExcel}>
          Xuất Excel
        </Button>
      </Space>
      <Table
        rowKey="period"
        loading={loading}
        pagination={false}
        dataSource={rows}
        columns={columns}
        expandable={
          deduction
            ? {
                expandedRowRender: (row) => <RateTable rates={row.byRate} />,
                rowExpandable: (row) => row.byRate.length > 0,
              }
            : undefined
        }
      />
    </Space>
  );
};

export default RevenueReport;
