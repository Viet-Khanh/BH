import { useState, useEffect, useCallback } from 'react';
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
  getCustomerDebt,
} from '../features/sales/api/salesApi.js';
import { formatMoney } from '../utils/moneyFormat.js';
import { generateCode } from '../utils/codeGenerator.js';
import { formatNumberInput, parseNumberInput } from '../utils/numberInput.js';
import { printHtml } from '../utils/printUtils.js';
import { renderDebtReceiptTemplate } from '../utils/renderDebtReceiptTemplate.js';

const CustomerDebtReceiptModal = ({
  open,
  onClose,
  initialCustomerId = '',
  customers = [],
  settings = null,
  onSuccess,
}) => {
  const [customerId, setCustomerId] = useState(initialCustomerId);
  const [date, setDate] = useState(new Date().toISOString());
  const [amount, setAmount] = useState(0);
  const [method, setMethod] = useState('cash');
  const [note, setNote] = useState('');
  const [debt, setDebt] = useState(0);
  const [saving, setSaving] = useState(false);
  const [submitMode, setSubmitMode] = useState('');

  useEffect(() => {
    if (open) {
      setCustomerId(initialCustomerId || '');
      setDate(new Date().toISOString());
      setAmount(0);
      setMethod('cash');
      setNote('');
      setDebt(0);
      setSaving(false);
      setSubmitMode('');
    }
  }, [open, initialCustomerId]);

  useEffect(() => {
    if (!open || !customerId) {
      setDebt(0);
      return;
    }
    let active = true;
    const loadDebt = async () => {
      try {
        const data = await getCustomerDebt({ customerId });
        if (active) {
          setDebt(Number(data?.debt || 0));
        }
      } catch (error) {
        if (active) {
          setDebt(0);
          message.error('Không thể tải công nợ khách hàng.');
        }
      }
    };
    loadDebt();
    return () => {
      active = false;
    };
  }, [open, customerId]);

  const handlePrint = useCallback(
    async ({ receipt, customer, debtBefore }) => {
      const html = renderDebtReceiptTemplate({
        receipt,
        customer,
        settings,
        debtBefore,
      });
      const printCopies = Math.max(
        1,
        Math.round(Number(settings?.printCopies || 1))
      );
      await printHtml(html, { copies: printCopies, autoPageSize: true });
    },
    [settings]
  );

  const handleCreate = async ({ shouldPrint = false } = {}) => {
    if (!customerId) {
      message.error('Chọn khách hàng.');
      return;
    }
    const payAmount = Number(amount || 0);
    if (payAmount <= 0) {
      message.error('Số tiền thu nợ phải lớn hơn 0.');
      return;
    }

    setSaving(true);
    setSubmitMode(shouldPrint ? 'print' : 'save');
    try {
      const receiptCode = generateCode('PTN');
      const payload = {
        id: uuid(),
        code: receiptCode,
        customerId,
        paymentType: 'debt_receipt',
        date: date || new Date().toISOString(),
        method,
        amount: payAmount,
        note: note || '',
      };

      const created = await createPayment(payload);
      const nextReceipt = created || payload;
      const currentCustomer =
        customers.find((c) => c.id === customerId) || null;

      onSuccess?.(customerId);
      onClose();

      if (shouldPrint) {
        try {
          await handlePrint({
            receipt: nextReceipt,
            customer: currentCustomer,
            debtBefore: debt,
          });
        } catch (error) {
          message.warning('Đã lưu phiếu thu nợ nhưng không thể in tự động.');
          return;
        }
      }
      message.success(
        shouldPrint ? 'Đã tạo và in phiếu thu nợ.' : 'Đã tạo phiếu thu nợ.'
      );
    } catch (error) {
      message.error(
        `Không thể tạo phiếu thu nợ: ${error.message || 'Lỗi không xác định'}`
      );
    } finally {
      setSubmitMode('');
      setSaving(false);
    }
  };

  return (
    <Modal title="Phiếu thu nợ" open={open} onCancel={onClose} footer={null}>
      <div className="pos-payment">
        <div className="pos-payment-row">
          <span>Khách hàng:</span>
          <Select
            showSearch
            optionFilterProp="label"
            placeholder="Chọn khách hàng"
            value={customerId || undefined}
            onChange={(val) => setCustomerId(val || '')}
            options={customers.map((c) => ({
              value: c.id,
              label: c.name || 'Khách hàng',
            }))}
          />
        </div>
        <div className="pos-payment-row">
          <span>Ngày thu:</span>
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
          <span>Số tiền thu:</span>
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
            placeholder="Nội dung thu nợ"
          />
        </div>
        <div className="pos-payment-actions">
          <Button
            type="primary"
            className="btn-success"
            onClick={() => handleCreate({ shouldPrint: true })}
            loading={saving && submitMode === 'print'}
          >
            Lưu và in
          </Button>
          <Button
            type="primary"
            className="btn-primary"
            onClick={() => handleCreate({ shouldPrint: false })}
            loading={saving && submitMode === 'save'}
          >
            Lưu phiếu thu
          </Button>
          <Button onClick={onClose} disabled={saving}>
            Thoát
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default CustomerDebtReceiptModal;
