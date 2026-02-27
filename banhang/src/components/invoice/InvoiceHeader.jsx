import { Button, Space } from 'antd';

const InvoiceHeader = ({
  onCancel,
  onPreview,
  onShowDebt,
  onOpenPayment,
  title = 'BÁN HÀNG',
  backLabel = 'F5 - Quay lại',
  showPreview = true,
  previewLabel = 'Xem trước',
  showPayment = true,
  paymentLabel = 'F8 - Thanh toán',
  extraActions,
}) => (
  <div className="pos-header">
    <Button size="large" onClick={onCancel}>
      {backLabel}
    </Button>
    <div className="pos-header-title">{title}</div>
    <div className="pos-header-actions">
      <Space wrap>
        {showPreview && onPreview && (
          <Button size="large" className="btn-accent" onClick={onPreview}>
            {previewLabel}
          </Button>
        )}
        {showPayment && onOpenPayment && (
          <Button size="large" className="btn-success" onClick={onOpenPayment}>
            {paymentLabel}
          </Button>
        )}
        {extraActions}
      </Space>
    </div>
  </div>
);

export default InvoiceHeader;
