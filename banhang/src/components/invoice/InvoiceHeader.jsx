import { Button, Space } from 'antd';

const InvoiceHeader = ({ onCancel, onPreview, onShowDebt, onOpenPayment }) => (
  <div className="pos-header">
    <Button size="large" onClick={onCancel}>
      F5 - Quay lại
    </Button>
    <div className="pos-header-title">BÁN HÀNG</div>
    <div className="pos-header-actions">
      <Space wrap>
        <Button size="large" className="btn-accent" onClick={onPreview}>
          Xem trước
        </Button>
        {/* <Button size="large" onClick={onShowDebt}>
          Trả nợ
        </Button> */}
        <Button size="large" className="btn-success" onClick={onOpenPayment}>
          F8 - Thanh toán
        </Button>
      </Space>
    </div>
  </div>
);

export default InvoiceHeader;
