import { Button, DatePicker, Input, InputNumber, Modal, Select } from 'antd';
import dayjs from 'dayjs';
import { formatMoney } from '../../../utils/moneyFormat.js';
import {
  formatNumberInput,
  parseNumberInput,
} from '../../../utils/numberInput.js';

const DebtReceiptEditorModal = ({
  editingDebtReceipt,
  customerName,
  editingDebtReceiptDate,
  setEditingDebtReceiptDate,
  editingDebtReceiptAmount,
  setEditingDebtReceiptAmount,
  editingDebtReceiptMethod,
  setEditingDebtReceiptMethod,
  editingDebtReceiptNote,
  setEditingDebtReceiptNote,
  editingDebtReceiptTimelineRow,
  onClose,
  onSave,
  savingDebtReceipt,
  debtReceiptSubmitMode,
}) => (
  <Modal
    title="Sửa phiếu thu nợ"
    open={!!editingDebtReceipt}
    onCancel={onClose}
    footer={null}
    destroyOnHidden
  >
    {editingDebtReceipt ? (
      <div className="pos-payment">
        <div className="pos-payment-row">
          <span>Số phiếu:</span>
          <Input
            value={editingDebtReceipt.code || editingDebtReceipt.id}
            readOnly
          />
        </div>
        <div className="pos-payment-row">
          <span>Khách hàng:</span>
          <Input value={customerName || ''} readOnly />
        </div>
        <div className="pos-payment-row">
          <span>Ngày thu:</span>
          <DatePicker
            style={{ width: '100%' }}
            value={
              editingDebtReceiptDate ? dayjs(editingDebtReceiptDate) : null
            }
            onChange={(value) =>
              setEditingDebtReceiptDate(
                value
                  ? value.endOf('day').toISOString()
                  : editingDebtReceipt.date || new Date().toISOString()
              )
            }
            format="DD/MM/YYYY"
          />
        </div>
        <div className="pos-payment-row">
          <span>Số tiền thu:</span>
          <InputNumber
            style={{ width: '100%' }}
            min={0}
            value={editingDebtReceiptAmount}
            onChange={(value) =>
              setEditingDebtReceiptAmount(Number(value || 0))
            }
            formatter={formatNumberInput}
            parser={parseNumberInput}
          />
        </div>
        <div className="pos-payment-row">
          <span>Phương thức:</span>
          <Select
            value={editingDebtReceiptMethod}
            onChange={setEditingDebtReceiptMethod}
            options={[
              { value: 'cash', label: 'Tiền mặt' },
              { value: 'bank', label: 'Chuyển khoản' },
              { value: 'other', label: 'Khác' },
            ]}
          />
        </div>
        <div className="pos-payment-row">
          <span>Ghi chú:</span>
          <Input
            value={editingDebtReceiptNote}
            onChange={(event) => setEditingDebtReceiptNote(event.target.value)}
            placeholder="Nội dung thu nợ"
          />
        </div>
        <div className="pos-payment-row total">
          <span>Nợ cũ theo phiếu hiện tại:</span>
          <strong>
            {formatMoney(editingDebtReceiptTimelineRow?.oldDebt || 0)}
          </strong>
        </div>
        <div className="pos-payment-row total">
          <span>Còn lại theo phiếu hiện tại:</span>
          <strong>
            {formatMoney(editingDebtReceiptTimelineRow?.remain || 0)}
          </strong>
        </div>
        <div style={{ fontSize: 12, color: '#8c8c8c', marginTop: 4 }}>
          Khi sửa ngày hoặc số tiền, hệ thống sẽ tính lại công nợ và nợ cũ theo
          timeline sau khi lưu.
        </div>
        <div className="pos-payment-actions">
          <Button
            type="primary"
            className="btn-success"
            onClick={() => onSave({ shouldPrint: true })}
            loading={savingDebtReceipt && debtReceiptSubmitMode === 'print'}
          >
            Lưu và in lại
          </Button>
          <Button
            type="primary"
            className="btn-primary"
            onClick={() => onSave({ shouldPrint: false })}
            loading={savingDebtReceipt && debtReceiptSubmitMode === 'save'}
          >
            Lưu
          </Button>
          <Button onClick={onClose} disabled={savingDebtReceipt}>
            Thoát
          </Button>
        </div>
      </div>
    ) : null}
  </Modal>
);

export default DebtReceiptEditorModal;
