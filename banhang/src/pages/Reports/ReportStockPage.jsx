import { Button } from 'antd';
import { useNavigate } from 'react-router-dom';
import ReportStockTab from './ReportStockTab.jsx';

const ReportStockPage = () => {
  const navigate = useNavigate();

  return (
    <div className="page-card">
      <div className="page-title">Báo cáo kho</div>
      <div className="action-row">
        <Button size="large" onClick={() => navigate('/')}>Quay lại</Button>
      </div>
      <ReportStockTab />
    </div>
  );
};

export default ReportStockPage;
