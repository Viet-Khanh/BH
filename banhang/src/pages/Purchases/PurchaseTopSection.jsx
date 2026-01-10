import dayjs from 'dayjs';
import { Button, DatePicker, Input, Select } from 'antd';
import { formatMoney } from '../../utils/moneyFormat.js';

const PurchaseTopSection = ({
  code,
  date,
  onDateChange,
  onCancelTicket,
  onNewTicket,
  onSave,
  disableSave = false,
  itemsCount,
  totalQty,
  supplierDebt,
  total,
  supplierId,
  onSupplierChange,
  supplierOptions,
  supplier,
  note,
  onNoteChange,
  readOnly = false,
}) => (
  <div className="pos-top">
    <div className="pos-info-box">
      <div className="pos-info-row">Phiếu: <strong>{code}</strong></div>
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
        <Button type="primary" className="btn-primary" onClick={onNewTicket}>
          F2 - Tạo phiếu
        </Button>
        <Button type="primary" className="btn-primary" onClick={onSave} disabled={disableSave}>
          F6 - Lưu
        </Button>
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
        <strong>{formatMoney(supplierDebt)}</strong>
      </div>
      <div className="pos-summary-row total">
        <span>Tổng tiền:</span>
        <strong>{formatMoney(total)}</strong>
      </div>
    </div>

    <div className="pos-info-box">
      <div className="pos-info-row">
        <span>Nhà cung cấp:</span>
        <Select
          value={supplierId}
          onChange={onSupplierChange}
          style={{ width: '100%' }}
          options={supplierOptions}
          showSearch
          optionFilterProp="label"
          disabled={readOnly}
        />
      </div>
      <div className="pos-info-row">
        <span>SĐT:</span>
        <Input value={supplier?.phone || ''} readOnly />
      </div>
      <div className="pos-info-row">
        <span>Địa chỉ:</span>
        <Input value={supplier?.address || ''} readOnly />
      </div>
      <div className="pos-info-row">
        <span>Ghi chú:</span>
        <Input
          value={note}
          onChange={(event) => onNoteChange(event.target.value)}
          disabled={readOnly}
        />
      </div>
    </div>
  </div>
);

export default PurchaseTopSection;
