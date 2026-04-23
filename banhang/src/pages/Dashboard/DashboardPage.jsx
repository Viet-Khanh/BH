import { Button } from 'antd';
import { useNavigate } from 'react-router-dom';
import TodayDashboard from '../../features/dashboard/components/TodayDashboard.jsx';

const DashboardPage = () => {
  const navigate = useNavigate();

  return (
    <div className="page-card">
      <div className="page-title">Dashboard hôm nay</div>
      <div className="action-row">
        <Button size="large" onClick={() => navigate('/')}>
          Quay lại
        </Button>
      </div>
      <TodayDashboard />
    </div>
  );
};

export default DashboardPage;
