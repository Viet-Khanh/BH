import { Button, Input, InputNumber, Modal, Select } from 'antd';
import { formatMoney } from '../../utils/moneyFormat.js';
import {
  formatNumberInput,
  parseNumberInput,
} from '../../pages/Catalog/catalogUtils.js';

const InvoicePaymentModal = ({
  open,
  onClose,
  title = 'Thanh toán bán hàng',
  partnerLabel = 'Khách hàng',
  totalLabel = 'Tổng cộng',
  debtLabel = 'Nợ cũ',
  totalPaymentLabel = 'Tổng thanh toán',
  paymentLabel = 'Khách trả',
  remainingLabel = 'Còn lại',
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
  <Modal title={title} open={open} onCancel={onClose} footer={null}>
    <div className="pos-payment">
      <div className="pos-payment-row">
        <span>{partnerLabel}:</span>
        <strong>{customerName}</strong>
      </div>
      <div className="pos-payment-row">
        <span>{totalLabel}:</span>
        <strong>{formatMoney(total)}</strong>
      </div>
      <div className="pos-payment-row">
        <span>{debtLabel}:</span>
        <strong>{formatMoney(customerDebt)}</strong>
      </div>
      <div className="pos-payment-row total">
        <span>{totalPaymentLabel}:</span>
        <strong>{formatMoney(totalPayment)}</strong>
      </div>

      <div className="pos-payment-row">
        <span>{paymentLabel}:</span>
        <div style={{ display: 'flex', gap: 12 }}>
          <InputNumber
            style={{ width: '100%' }}
            value={paymentAmount}
            onChange={onPaymentAmountChange}
            formatter={formatNumberInput}
            parser={parseNumberInput}
          />
          <Button onClick={onPayFull}>Trả đủ</Button>
        </div>
      </div>
      <div className="pos-payment-row">
        <span>{remainingLabel}:</span>
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
        <Input
          value={paymentNote}
          onChange={(event) => onPaymentNoteChange(event.target.value)}
        />
      </div>

      <div className="pos-payment-actions">
        <Button
          type="primary"
          className="btn-success"
          onClick={onCheckoutPrint}
        >
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
