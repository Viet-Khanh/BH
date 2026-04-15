import { useState, useEffect } from 'react';
import {
  Button,
  DatePicker,
  Input,
  InputNumber,
  Modal,
  Select,
  message,
} from 'antd';
import dayjs from 'dayjs';
import { v4 as uuid } from 'uuid';
import {
  createPayment,
  getSupplierDebt,
} from '../features/purchases/api/purchasesApi.js';
import { formatMoney } from '../utils/moneyFormat.js';
import { formatNumberInput, parseNumberInput } from '../utils/numberInput.js';

const SupplierDebtPaymentModal = ({
  open,
  onClose,
  initialSupplierId = '',
  suppliers = [],
  onSuccess,
}) => {
  const [supplierId, setSupplierId] = useState(initialSupplierId);
  const [date, setDate] = useState(new Date().toISOString());
  const [amount, setAmount] = useState(0);
  const [method, setMethod] = useState('cash');
  const [note, setNote] = useState('');
  const [debt, setDebt] = useState(0);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setSupplierId(initialSupplierId || '');
      setDate(new Date().toISOString());
      setAmount(0);
      setMethod('cash');
      setNote('');
      setDebt(0);
      setSaving(false);
    }
  }, [open, initialSupplierId]);

  useEffect(() => {
    if (!open || !supplierId) {
      setDebt(0);
      return;
    }
    let active = true;
    const loadDebt = async () => {
      try {
        const data = await getSupplierDebt({ supplierId });
        if (active) {
          setDebt(Number(data?.debt || 0));
        }
      } catch (error) {
        if (active) {
          setDebt(0);
          message.error('Không thể tải công nợ nhà cung cấp.');
        }
      }
    };
    loadDebt();
    return () => {
      active = false;
    };
  }, [open, supplierId]);

  const handleCreate = async () => {
    if (!supplierId) {
      message.error('Chọn nhà cung cấp.');
      return;
    }
    const payAmount = Number(amount || 0);
    if (payAmount <= 0) {
      message.error('Số tiền trả nợ phải lớn hơn 0.');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        id: uuid(),
        supplierId,
        paymentType: 'supplier_debt_payment',
        date: date || new Date().toISOString(),
        method,
        amount: payAmount,
        note: note || '',
      };

      await createPayment(payload);
      onSuccess?.(supplierId);
      onClose();

      message.success('Đã tạo phiếu trả nợ nhà cung cấp.');
    } catch (error) {
      message.error(
        `Không thể tạo phiếu trả nợ: ${error.message || 'Lỗi không xác định'}`
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      title="Phiếu trả nợ nhà cung cấp"
      open={open}
      onCancel={onClose}
      onOk={handleCreate}
      okText="Lưu phiếu trả nợ"
      cancelText="Hủy"
      confirmLoading={saving}
    >
      <div className="pos-payment">
        <div className="pos-payment-row">
          <span>Nhà cung cấp:</span>
          <Select
            showSearch
            optionFilterProp="label"
            placeholder="Chọn nhà cung cấp"
            value={supplierId || undefined}
            onChange={(val) => setSupplierId(val || '')}
            options={suppliers.map((s) => ({
              value: s.id,
              label: s.name || 'Nhà cung cấp',
            }))}
          />
        </div>
        <div className="pos-payment-row">
          <span>Ngày trả:</span>
          <DatePicker
            style={{ width: '100%' }}
            value={dayjs(date)}
            onChange={(val) =>
              setDate(
                val ? val.endOf('day').toISOString() : new Date().toISOString()
              )
            }
            format="DD/MM/YYYY"
          />
        </div>
        <div className="pos-payment-row total">
          <span>Công nợ hiện tại:</span>
          <strong>{formatMoney(debt)}</strong>
        </div>
        <div className="pos-payment-row">
          <span>Số tiền trả:</span>
          <InputNumber
            style={{ width: '100%' }}
            min={0}
            value={amount}
            onChange={(val) => setAmount(Number(val || 0))}
            formatter={formatNumberInput}
            parser={parseNumberInput}
          />
        </div>
        <div className="pos-payment-row">
          <span>Phương thức:</span>
          <Select
            value={method}
            onChange={setMethod}
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
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Nội dung trả nợ"
          />
        </div>
      </div>
    </Modal>
  );
};

export default SupplierDebtPaymentModal;
