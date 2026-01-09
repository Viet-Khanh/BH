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
}) => (
  <div className="pos-top">
    <div className="pos-info-box">
      <div className="pos-info-row">HĐ: <strong>{code}</strong></div>
      <div className="pos-info-row">
        Ngày:
        <DatePicker
          value={dayjs(date)}
          onChange={onDateChange}
        />
      </div>
      <div className="pos-info-row">NV: <strong>admin</strong></div>
      <div className="pos-actions-row">
        <Button danger onClick={onCancelTicket}>F3 - Hủy phiếu</Button>
        <Button onClick={onShowRecent}>F4 - HĐ gần đây</Button>
        {showNewTicket && (
          <Button type="primary" className="btn-primary" onClick={onNewTicket}>
            F2 - Tạo phiếu
          </Button>
        )}
      </div>
    </div>

    <div className="pos-summary">
      <div className="pos-summary-row">
        <span>Tổng MH:</span>
        <strong>{itemsCount}</strong>
      </div>
      <div className="pos-summary-row">
        <span>Tổng SL:</span>
        <strong>{totalQty.toFixed(1)}</strong>
      </div>
      <div className="pos-summary-row">
        <span>Nợ cũ:</span>
        <strong>{formatMoney(customerDebt)}</strong>
      </div>
      <div className="pos-summary-row total">
        <span>Tổng tiền:</span>
        <strong>{formatMoney(total)}</strong>
      </div>
    </div>

    <div className="pos-info-box">
      <div className="pos-info-row">
        <span style={{ width: 150 }}>Tên khách hàng:</span>
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
        />
      </div>
      <div className="pos-info-row">
        <span style={{ width: 150 }}>Điện thoại:</span>
        <Input value={customer?.phone || ''} readOnly />
      </div>
      <div className="pos-info-row">
        <span style={{ width: 150 }}>Địa chỉ:</span>
        <Input value={customer?.address || ''} readOnly />
      </div>
      <div className="pos-info-row">
        <span style={{ width: 150 }}>Ghi chú:</span>
        <Input value={note} onChange={(event) => onNoteChange(event.target.value)} />
      </div>
    </div>
  </div>
);

export default InvoiceTopSection;
