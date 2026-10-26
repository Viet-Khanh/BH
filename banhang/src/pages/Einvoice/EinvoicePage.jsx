import { Button } from 'antd';
import { useNavigate } from 'react-router-dom';
import EinvoiceScreen from '../../features/einvoice/screen/EinvoiceScreen.jsx';

const EinvoicePage = () => {
  const navigate = useNavigate();

  return (
    <div className="page-card">
      <div className="page-title">Hoá đơn điện tử</div>
      <div className="action-row">
        <Button size="large" onClick={() => navigate('/')}>
          Quay lại
        </Button>
      </div>
      <EinvoiceScreen />
    </div>
  );
};

export default EinvoicePage;
