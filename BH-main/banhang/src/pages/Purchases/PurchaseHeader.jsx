import { Button, Space } from 'antd';

const PurchaseHeader = ({ onBack, onOpenRecent, onOpenPayment }) => (
  <div className="pos-header">
    <Button size="large" onClick={onBack}>
      F5 - Quay lại
    </Button>
    <div className="pos-header-title">NHẬP HÀNG</div>
    <div className="pos-header-actions">
      <Space wrap>
        <Button size="large" onClick={onOpenRecent}>
          Phiếu gần đây
        </Button>
        <Button size="large" className="btn-success" onClick={onOpenPayment}>
          Thanh toán
        </Button>
      </Space>
    </div>
  </div>
);

export default PurchaseHeader;
