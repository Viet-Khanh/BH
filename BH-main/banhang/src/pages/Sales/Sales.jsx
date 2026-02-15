import { useCallback, useEffect, useRef, useState } from 'react';
import { message } from 'antd';
import { useLocation, useNavigate } from 'react-router-dom';
import { v4 as uuid } from 'uuid';
import { useCustomerStore } from '../../store/customerStore.js';
import { useSettingsStore } from '../../store/settingsStore.js';
import InvoiceEditor from '../../components/InvoiceEditor.jsx';
import { formatMoney } from '../../utils/moneyFormat.js';
import { generateCode } from '../../utils/codeGenerator.js';
import { addItem, apiRequest, deleteItem, updateItem } from '../../db/repository.js';

const computeStatus = (total, paid) => {
  if (paid <= 0) return 'CHUA THU';
  if (paid < total) return 'THU 1 PHAN';
  return 'DA THU';
};

const mergeProducts = (current = [], incoming = []) => {
  const map = new Map();
  incoming.forEach((item) => {
    if (item?.id) map.set(item.id, item);
  });
  current.forEach((item) => {
    if (item?.id && !map.has(item.id)) map.set(item.id, item);
  });
  return Array.from(map.values());
};

const sumPayments = (items = []) =>
  items.reduce((sum, payment) => sum + Number(payment.amount || 0), 0);

const Sales = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const editId = location.state?.editInvoiceId;
  const { items: customers, load: loadCustomers, ensureDefaultCustomer } = useCustomerStore();
  const { settings, load: loadSettings } = useSettingsStore();

  const [editing, setEditing] = useState(null);
  const [products, setProducts] = useState([]);
  const [invoicePayments, setInvoicePayments] = useState([]);
  const [customerDebt, setCustomerDebt] = useState(0);
  const editingRef = useRef(null);

  useEffect(() => {
    const bootstrap = async () => {
      await Promise.all([loadCustomers(), loadSettings()]);
      await ensureDefaultCustomer();
    };
    bootstrap();
  }, [loadCustomers, loadSettings, ensureDefaultCustomer]);

  useEffect(() => {
    editingRef.current = editing;
  }, [editing]);

  useEffect(() => {
    if (!editId) return;
    let cancelled = false;
    const fetchInvoice = async () => {
      try {
        const data = await apiRequest(`/reports/invoices/${editId}`);
        if (!data || cancelled) return;
        setEditing(data.invoice || null);
        editingRef.current = data.invoice || null;
        setInvoicePayments(Array.isArray(data.payments) ? data.payments : []);
        setProducts((prev) => mergeProducts(prev, Array.isArray(data.products) ? data.products : []));
      } catch (error) {
        if (!cancelled) {
          message.error('Không thể tải hóa đơn.');
        }
      }
    };
    fetchInvoice();
    return () => {
      cancelled = true;
    };
  }, [editId]);

  const handleSearchProducts = useCallback(async (keyword = '') => {
    const params = new URLSearchParams();
    if (keyword) params.set('search', keyword);
    params.set('limit', '30');
    try {
      const data = await apiRequest(`/sales/products?includeDeleted=1&${params.toString()}`);
      if (Array.isArray(data)) {
        setProducts((prev) => mergeProducts(prev, data));
      }
    } catch (error) {
      message.error('Không thể tải danh sách sản phẩm.');
    }
  }, []);

  const handleCustomerChange = useCallback(async (nextCustomerId, excludeInvoiceId) => {
    if (!nextCustomerId) {
      setCustomerDebt(0);
      return;
    }
    const params = new URLSearchParams({ customerId: nextCustomerId });
    if (excludeInvoiceId) params.set('excludeInvoiceId', excludeInvoiceId);
    try {
      const data = await apiRequest(`/sales/customer-debt?${params.toString()}`);
      setCustomerDebt(Number(data?.debt || 0));
    } catch (error) {
      setCustomerDebt(0);
      message.error('Không thể tải công nợ khách hàng.');
    }
  }, []);

  const handleSaveInvoice = async (data) => {
    if (editing) {
      const paid = sumPayments(invoicePayments);
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
      const saved = await updateItem('invoices', editing.id, nextInvoice);
      const next = saved || nextInvoice;
      setEditing(next);
      editingRef.current = next;
      message.success('Đã cập nhật hóa đơn.');
      return next;
    }

    const newInvoice = {
      id: uuid(),
      code: data.code || generateCode('INV'),
      paymentStatus: 'CHUA THU',
      changeLog: [{ date: new Date().toISOString(), note: 'Tạo hóa đơn' }],
      ...data,
    };
    const created = await addItem('invoices', newInvoice);
    const next = created || newInvoice;
    setEditing(next);
    editingRef.current = next;
    setInvoicePayments([]);
    message.success('Đã tạo hóa đơn.');
    return next;
  };

  const refreshPaymentStatus = async (invoiceId, nextPayments) => {
    const targetInvoice = editingRef.current;
    const total = targetInvoice?.id === invoiceId ? Number(targetInvoice.total || 0) : 0;
    const paid = sumPayments(nextPayments);
    const paymentStatus = computeStatus(total, paid);
    await updateItem('invoices', invoiceId, { paymentStatus });
    setEditing((prev) => (prev?.id === invoiceId ? { ...prev, paymentStatus } : prev));
  };

  const handleAddPayment = async (payment) => {
    const invoiceId = payment.invoiceId || editingRef.current?.id;
    if (!invoiceId) return;
    const payload = { ...payment, invoiceId };
    const created = await addItem('payments', payload);
    const nextPayment = created || payload;
    const nextPayments = [...invoicePayments, nextPayment];
    setInvoicePayments(nextPayments);
    await refreshPaymentStatus(invoiceId, nextPayments);
    message.success('Đã ghi nhận thanh toán.');
  };

  const handleUpdatePayment = async (paymentId, data) => {
    const existing = invoicePayments.find((payment) => payment.id === paymentId);
    const invoiceId = data.invoiceId || existing?.invoiceId || editingRef.current?.id;
    if (!existing || !invoiceId) return;
    const nextPayment = { ...existing, ...data, invoiceId };
    const saved = await updateItem('payments', paymentId, nextPayment);
    const updated = saved || nextPayment;
    const nextPayments = invoicePayments.map((payment) =>
      payment.id === paymentId ? updated : payment
    );
    setInvoicePayments(nextPayments);
    await refreshPaymentStatus(invoiceId, nextPayments);
    message.success('Đã cập nhật thanh toán.');
  };

  const handleRemovePayment = async (paymentId) => {
    const existing = invoicePayments.find((payment) => payment.id === paymentId);
    const invoiceId = existing?.invoiceId || editingRef.current?.id;
    if (!invoiceId) return;
    await deleteItem('payments', paymentId);
    const nextPayments = invoicePayments.filter((payment) => payment.id !== paymentId);
    setInvoicePayments(nextPayments);
    await refreshPaymentStatus(invoiceId, nextPayments);
    message.success('Đã cập nhật thanh toán.');
  };

  return (
    <div>
      <InvoiceEditor
        invoice={editing}
        customers={customers}
        products={products}
        payments={editing ? invoicePayments : []}
        settings={settings}
        customerDebtOverride={customerDebt}
        onSearchProducts={handleSearchProducts}
        onCustomerChange={handleCustomerChange}
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
        onNewInvoice={() => {
          editingRef.current = null;
          setEditing(null);
          setInvoicePayments([]);
        }}
      />
    </div>
  );
};

export default Sales;
