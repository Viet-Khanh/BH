import dayjs from 'dayjs';
import { Button, DatePicker, Input, Select } from 'antd';
import { formatMoney } from '../../utils/moneyFormat.js';

const InvoiceTopSection = ({
  code,
  date,
  onDateChange,
  onCancelTicket,
  onShowRecent,
  onNewTicket,
  showNewTicket = true,
  showRecent = true,
  itemsCount,
  totalQty,
  customerDebt,
  total,
  customerId,
  onCustomerChange,
  customers,
  customer,
  note,
  onNoteChange,
  codeLabel = 'HĐ',
  recentLabel = 'F4 - HĐ gần đây',
  partnerLabel = 'Tên khách hàng',
  partnerPhoneLabel = 'Điện thoại',
  partnerAddressLabel = 'Địa chỉ',
  noteLabel = 'Ghi chú',
  itemsLabel = 'Tổng MH',
  qtyLabel = 'Tổng SL',
  debtLabel = 'Nợ cũ',
  totalLabel = 'Tổng tiền',
  readOnly = false,
}) => (
  <div className="pos-top">
    <div className="pos-info-box">
      <div className="pos-info-row">{codeLabel}: <strong>{code}</strong></div>
      <div className="pos-info-row">
        Ngày:
        <DatePicker
          value={dayjs(date)}
          onChange={onDateChange}
          disabled={readOnly}
        />
      </div>
      <div className="pos-info-row">NV: <strong>admin</strong></div>
      <div className="pos-actions-row">
        <Button danger onClick={onCancelTicket}>F3 - Hủy phiếu</Button>
        {showRecent && (
          <Button onClick={onShowRecent}>{recentLabel}</Button>
        )}
        {showNewTicket && (
          <Button type="primary" className="btn-primary" onClick={onNewTicket}>
            F2 - Tạo phiếu
          </Button>
        )}
      </div>
    </div>

    <div className="pos-summary">
      <div className="pos-summary-row">
        <span>{itemsLabel}:</span>
        <strong>{itemsCount}</strong>
      </div>
      <div className="pos-summary-row">
        <span>{qtyLabel}:</span>
        <strong>{totalQty.toFixed(1)}</strong>
      </div>
      <div className="pos-summary-row">
        <span>{debtLabel}:</span>
        <strong>{formatMoney(customerDebt)}</strong>
      </div>
      <div className="pos-summary-row total">
        <span>{totalLabel}:</span>
        <strong>{formatMoney(total)}</strong>
      </div>
    </div>

    <div className="pos-info-box">
      <div className="pos-info-row">
        <span style={{ width: 150 }}>{partnerLabel}:</span>
        <Select
          value={customerId}
          onChange={onCustomerChange}
          style={{ width: '100%' }}
          options={customers.map((item) => ({
            value: item.id,
            label: item.name,
          }))}
          showSearch
          optionFilterProp="label"
          disabled={readOnly}
        />
      </div>
      <div className="pos-info-row">
        <span style={{ width: 150 }}>{partnerPhoneLabel}:</span>
        <Input value={customer?.phone || ''} readOnly />
      </div>
      <div className="pos-info-row">
        <span style={{ width: 150 }}>{partnerAddressLabel}:</span>
        <Input value={customer?.address || ''} readOnly />
      </div>
      <div className="pos-info-row">
        <span style={{ width: 150 }}>{noteLabel}:</span>
        <Input
          value={note}
          onChange={(event) => onNoteChange(event.target.value)}
          disabled={readOnly}
        />
      </div>
    </div>
  </div>
);

export default InvoiceTopSection;
