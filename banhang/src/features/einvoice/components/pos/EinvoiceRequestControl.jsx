import { Button, Checkbox, message } from 'antd';
import { useState } from 'react';
import { useCustomerStore } from '../../../../store/customerStore.js';
import {
  customerPatch,
  requestSummary,
  toRequest,
} from '../../domain/buyerRequest.js';
import EinvoiceBuyerModal from './EinvoiceBuyerModal.jsx';

// Sales counter: "customer wants an e-invoice" + buyer details.
const EinvoiceRequestControl = ({ request, customer, onChange, disabled }) => {
  const [open, setOpen] = useState(false);
  const requested = Boolean(request?.requested);

  const toggle = (checked) => {
    if (checked && !request) {
      setOpen(true);
      return;
    }
    onChange({ ...request, requested: checked });
  };

  const save = async (values, saveToCustomer) => {
    const next = toRequest(values);
    onChange(next);
    setOpen(false);
    if (!saveToCustomer) return;
    try {
      await useCustomerStore
        .getState()
        .update(customer.id, customerPatch(next));
      message.success('Đã lưu thông tin hoá đơn vào khách hàng.');
    } catch (error) {
      message.error(`Không lưu được vào khách hàng: ${error.message}`);
    }
  };

  return (
    <div className="pos-info-row">
      <span style={{ width: 150 }}>Hoá đơn điện tử:</span>
      <Checkbox
        checked={requested}
        disabled={disabled}
        onChange={(event) => toggle(event.target.checked)}
      >
        Khách lấy HĐĐT
      </Checkbox>
      {requested && (
        <Button size="small" disabled={disabled} onClick={() => setOpen(true)}>
          {requestSummary(request) || 'Nhập thông tin'}
        </Button>
      )}
      <EinvoiceBuyerModal
        open={open}
        request={request}
        customer={customer}
        onCancel={() => setOpen(false)}
        onSave={save}
      />
    </div>
  );
};

export default EinvoiceRequestControl;
