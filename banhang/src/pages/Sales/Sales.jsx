import { useEffect, useState } from 'react';
import { Modal, message } from 'antd';
import { useLocation, useNavigate } from 'react-router-dom';
import { v4 as uuid } from 'uuid';
import { useCustomerStore } from '../../store/customerStore.js';
import { useProductStore } from '../../store/productStore.js';
import { useInvoiceStore } from '../../store/invoiceStore.js';
import { usePaymentStore } from '../../store/paymentStore.js';
import { usePurchaseStore } from '../../store/purchaseStore.js';
import { useSettingsStore } from '../../store/settingsStore.js';
import InvoiceEditor from '../../components/InvoiceEditor.jsx';
import { formatMoney } from '../../utils/moneyFormat.js';
import { generateCode } from '../../utils/codeGenerator.js';

const computeStatus = (total, paid) => {
  if (paid <= 0) return 'CHUA THU';
  if (paid < total) return 'THU 1 PHAN';
  return 'DA THU';
};

const Sales = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { items: customers } = useCustomerStore();
  const { items: products } = useProductStore();
  const { items: purchases } = usePurchaseStore();
  const { items: invoices, add: addInvoice, update: updateInvoice } = useInvoiceStore();
  const { items: payments, add: addPayment, update: updatePayment, remove: removePayment } = usePaymentStore();
  const { settings } = useSettingsStore();

  const [editing, setEditing] = useState(null);

  useEffect(() => {
    const editId = location.state?.editInvoiceId;
    if (!editId) return;
    const target = invoices.find((inv) => inv.id === editId);
    if (target) {
      setEditing(target);
    }
  }, [location.state, invoices]);

  const getPayments = (invoiceId) => payments.filter((p) => p.invoiceId === invoiceId);


  const handleEdit = (invoice) => {
    const invoicePayments = getPayments(invoice.id);
    if (invoicePayments.length) {
      Modal.confirm({
        title: 'Hóa đơn đã thu tiền',
        content: 'Chỉnh sửa sẽ được ghi vào lịch sử. Bạn có chắc muốn tiếp tục?',
        okText: 'Tiếp tục',
        cancelText: 'Hủy',
        onOk: () => {
          setEditing(invoice);
        },
      });
      return;
    }
    setEditing(invoice);
  };

  const handleSaveInvoice = async (data) => {
    if (editing) {
      const paid = getPayments(editing.id).reduce((sum, p) => sum + Number(p.amount || 0), 0);
      const paymentStatus = computeStatus(data.total, paid);
      const logs = editing.changeLog || [];
      if (editing.total !== data.total) {
        logs.push({
          date: new Date().toISOString(),
          note: `Cập nhật tổng từ ${formatMoney(editing.total)} -> ${formatMoney(data.total)}`,
        });
      } else {
        logs.push({
          date: new Date().toISOString(),
          note: 'Cập nhật hóa đơn',
        });
      }
      const nextInvoice = {
        ...editing,
        ...data,
        paymentStatus,
        changeLog: logs,
      };
      await updateInvoice(editing.id, nextInvoice);
      setEditing(nextInvoice);
      message.success('Đã cập nhật hóa đơn.');
      return nextInvoice;
    }

    const newInvoice = {
      id: uuid(),
      code: data.code || generateCode('INV'),
      paymentStatus: 'CHUA THU',
      changeLog: [{ date: new Date().toISOString(), note: 'Tạo hóa đơn' }],
      ...data,
    };
    await addInvoice(newInvoice);
    setEditing(newInvoice);
    message.success('Đã tạo hóa đơn.');
    return newInvoice;
  };

  const refreshPaymentStatus = async (invoiceId, paid) => {
    const targetInvoice = invoices.find((inv) => inv.id === invoiceId) || editing;
    const paymentStatus = computeStatus(targetInvoice?.total || 0, paid);
    await updateInvoice(invoiceId, { paymentStatus });
    if (editing?.id === invoiceId) {
      setEditing({ ...editing, paymentStatus });
    }
  };

  const handleAddPayment = async (payment) => {
    const invoiceId = payment.invoiceId || editing?.id;
    if (!invoiceId) return;
    const payload = { ...payment, invoiceId };
    await addPayment(payload);
    const paid =
      getPayments(invoiceId).reduce((sum, p) => sum + Number(p.amount || 0), 0) +
      Number(payment.amount || 0);
    await refreshPaymentStatus(invoiceId, paid);
    message.success('Đã ghi nhận thanh toán.');
  };

  const handleUpdatePayment = async (paymentId, data) => {
    const existing = payments.find((payment) => payment.id === paymentId);
    const invoiceId = data.invoiceId || existing?.invoiceId || editing?.id;
    if (!existing || !invoiceId) return;
    const nextPayment = { ...existing, ...data, invoiceId };
    await updatePayment(paymentId, nextPayment);
    const paid = payments
      .filter((payment) => payment.invoiceId === invoiceId && payment.id !== paymentId)
      .reduce((sum, payment) => sum + Number(payment.amount || 0), 0);
    await refreshPaymentStatus(invoiceId, paid + Number(nextPayment.amount || 0));
    message.success('Đã cập nhật thanh toán.');
  };

  const handleRemovePayment = async (paymentId) => {
    const existing = payments.find((payment) => payment.id === paymentId);
    const invoiceId = existing?.invoiceId || editing?.id;
    if (!invoiceId) return;
    await removePayment(paymentId);
    const paid = payments
      .filter((payment) => payment.invoiceId === invoiceId && payment.id !== paymentId)
      .reduce((sum, payment) => sum + Number(payment.amount || 0), 0);
    await refreshPaymentStatus(invoiceId, paid);
    message.success('Đã cập nhật thanh toán.');
  };

  return (
    <div>
      <InvoiceEditor
        invoice={editing}
        customers={customers}
        products={products}
        payments={editing ? getPayments(editing.id) : []}
        allPayments={payments}
        purchases={purchases}
        invoices={invoices}
        settings={settings}
        onSave={handleSaveInvoice}
        onCancel={() => navigate('/')}
        onAddPayment={handleAddPayment}
        onUpdatePayment={handleUpdatePayment}
        onRemovePayment={handleRemovePayment}
        onShowRecent={() => {
          navigate('/sales/recent');
        }}
        onShowDebt={() => {
          navigate('/sales/recent?debt=1');
        }}
        onShowTemplate={() => navigate('/system')}
        onNewInvoice={() => setEditing(null)}
      />
    </div>
  );
};

export default Sales;
