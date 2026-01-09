import { Button, Tabs } from 'antd';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ReportStockTab from './ReportStockTab.jsx';
import ReportDebtTab from './ReportDebtTab.jsx';
import ReportProfitTab from './ReportProfitTab.jsx';
import ReportCashTab from './ReportCashTab.jsx';
import ReportSalesInvoicesTab from './ReportSalesInvoicesTab.jsx';
import ReportSalesDetailsTab from './ReportSalesDetailsTab.jsx';

const Reports = () => {
  const navigate = useNavigate();
  const [profitRange, setProfitRange] = useState([null, null]);

  return (
    <div className="page-card">
      <div className="page-title">Báo cáo</div>
      <div className="action-row">
        <Button size="large" onClick={() => navigate('/')}>Quay lại</Button>
      </div>

      <Tabs
        type="card"
        items={[
          { key: 'stock', label: 'Tồn kho', children: <ReportStockTab /> },
          { key: 'debt', label: 'Công nợ', children: <ReportDebtTab /> },
          { key: 'sales', label: 'Hoá đơn bán hàng', children: <ReportSalesInvoicesTab /> },
          { key: 'sales-detail', label: 'Chi tiết bán hàng', children: <ReportSalesDetailsTab /> },
          {
            key: 'profit',
            label: 'Doanh thu & Lãi',
            children: <ReportProfitTab range={profitRange} onRangeChange={setProfitRange} />,
          },
          {
            key: 'summary',
            label: 'Thu/Chi',
            children: <ReportCashTab range={profitRange} onRangeChange={setProfitRange} />,
          },
        ]}
      />
    </div>
  );
};

export default Reports;
