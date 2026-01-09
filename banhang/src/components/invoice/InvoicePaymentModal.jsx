import { Button, Input, InputNumber, Modal, Select } from 'antd';
import { formatMoney } from '../../utils/moneyFormat.js';

const InvoicePaymentModal = ({
  open,
  onClose,
  customerName,
  total,
  customerDebt,
  totalPayment,
  remainingPayment,
  paymentAmount,
  onPaymentAmountChange,
  onPayFull,
  paymentMethod,
  onPaymentMethodChange,
  paymentNote,
  onPaymentNoteChange,
  onCheckoutPrint,
  onCheckout,
}) => (
  <Modal
    title="Thanh toán bán hàng"
    open={open}
    onCancel={onClose}
    footer={null}
  >
    <div className="pos-payment">
      <div className="pos-payment-row">
        <span>Khách hàng:</span>
        <strong>{customerName}</strong>
      </div>
      <div className="pos-payment-row">
        <span>Tổng cộng:</span>
        <strong>{formatMoney(total)}</strong>
      </div>
      <div className="pos-payment-row">
        <span>Nợ cũ:</span>
        <strong>{formatMoney(customerDebt)}</strong>
      </div>
      <div className="pos-payment-row total">
        <span>Tổng thanh toán:</span>
        <strong>{formatMoney(totalPayment)}</strong>
      </div>

      <div className="pos-payment-row">
        <span>Khách trả:</span>
        <div style={{ display: 'flex', gap: 12 }}>
          <InputNumber
            style={{ width: '100%' }}
            value={paymentAmount}
            onChange={onPaymentAmountChange}
          />
          <Button onClick={onPayFull}>Trả đủ</Button>
        </div>
      </div>
      <div className="pos-payment-row">
        <span>Còn lại:</span>
        <strong>{formatMoney(remainingPayment)}</strong>
      </div>

      <div className="pos-payment-row">
        <span>Phương thức:</span>
        <Select
          value={paymentMethod}
          onChange={onPaymentMethodChange}
          style={{ width: '100%' }}
          options={[
            { value: 'cash', label: 'Tiền mặt' },
            { value: 'bank', label: 'Chuyển khoản' },
            { value: 'debt', label: 'Công nợ' },
          ]}
        />
      </div>
      <div className="pos-payment-row">
        <span>Ghi chú:</span>
        <Input value={paymentNote} onChange={(event) => onPaymentNoteChange(event.target.value)} />
      </div>

      <div className="pos-payment-actions">
        <Button type="primary" className="btn-success" onClick={onCheckoutPrint}>
          F8 - Lưu và in
        </Button>
        <Button type="primary" className="btn-primary" onClick={onCheckout}>
          F12 - Lưu không in
        </Button>
        <Button onClick={onClose}>Thoát</Button>
      </div>
    </div>
  </Modal>
);

export default InvoicePaymentModal;
