import { useCallback, useEffect, useMemo, useState } from 'react';
import { Button, DatePicker, Input, InputNumber, Modal, Select, message } from 'antd';
import dayjs from 'dayjs';
import { useLocation, useNavigate } from 'react-router-dom';
import { v4 as uuid } from 'uuid';
import { useSupplierStore } from '../../store/supplierStore.js';
import InvoiceHeader from '../../components/invoice/InvoiceHeader.jsx';
import InvoiceTopSection from '../../components/invoice/InvoiceTopSection.jsx';
import InvoicePaymentModal from '../../components/invoice/InvoicePaymentModal.jsx';
import InvoicePaymentsSection from '../../components/invoice/InvoicePaymentsSection.jsx';
import InvoiceItemsTable from '../../components/invoice/InvoiceItemsTable.jsx';
import InvoiceSearchBar from '../../components/invoice/InvoiceSearchBar.jsx';
import InvoiceProductModal from '../../components/invoice/InvoiceProductModal.jsx';
import PurchaseRecentModal from './PurchaseRecentModal.jsx';
import PurchaseDetailModal from './PurchaseDetailModal.jsx';
import usePurchaseItems from './usePurchaseItems.js';
import usePurchasePayments from './usePurchasePayments.js';
import usePurchaseProductModal from './usePurchaseProductModal.js';
import { generateCode } from '../../utils/codeGenerator.js';
import { formatMoney } from '../../utils/moneyFormat.js';
import { addItem, apiRequest, deleteItem, updateItem as updateRecord } from '../../db/repository.js';
import { formatNumberInput, parseNumberInput } from '../../utils/numberInput.js';
const buildPurchaseItems = (purchase) =>
  (purchase?.items || []).map((item) => ({
    ...item,
    lineNote: item.lineNote || '',
  }));

const getPurchaseLineTotal = (item = {}) => {
  const qty = Number(item.qty || 0);
  const unitCost = Number(item.unitCost || 0);
  let lineTotal = qty * unitCost;
  const length = Number(item.length || 0);
  const width = Number(item.width || 0);
  if (length > 0 && width > 0) {
    lineTotal *= length * width;
  }
  return lineTotal;
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
const Purchases = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const editPurchaseId = location.state?.editPurchaseId;
  const { items: suppliers, load: loadSuppliers } = useSupplierStore();
  const [products, setProducts] = useState([]);
  const [recentPurchases, setRecentPurchases] = useState([]);
  const [exportRows, setExportRows] = useState([]);
  const [purchasePayments, setPurchasePayments] = useState([]);
  const [supplierDebt, setSupplierDebt] = useState(0);
  const [supplierId, setSupplierId] = useState('');
  const [date, setDate] = useState(new Date().toISOString());
  const [note, setNote] = useState('');
  const [items, setItems] = useState([]);
  const [draftCode, setDraftCode] = useState(generateCode('PO'));
  const [recentOpen, setRecentOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detail, setDetail] = useState(null);
  const [filterRange, setFilterRange] = useState([null, null]);
  const [filterSupplier, setFilterSupplier] = useState('');
  const [editing, setEditing] = useState(null);
  const [editScope, setEditScope] = useState('payment');
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [paymentNote, setPaymentNote] = useState('');
  const [supplierDebtPaymentOpen, setSupplierDebtPaymentOpen] = useState(false);
  const [supplierDebtPaymentSupplierId, setSupplierDebtPaymentSupplierId] = useState('');
  const [supplierDebtPaymentDate, setSupplierDebtPaymentDate] = useState(new Date().toISOString());
  const [supplierDebtPaymentAmount, setSupplierDebtPaymentAmount] = useState(0);
  const [supplierDebtPaymentMethod, setSupplierDebtPaymentMethod] = useState('cash');
  const [supplierDebtPaymentNote, setSupplierDebtPaymentNote] = useState('');
  const [supplierDebtPaymentDebt, setSupplierDebtPaymentDebt] = useState(0);
  const [savingSupplierDebtPayment, setSavingSupplierDebtPayment] = useState(false);

  useEffect(() => {
    const bootstrap = async () => {
      await loadSuppliers();
    };
    bootstrap();
  }, [loadSuppliers]);

  const handleSearchProducts = useCallback(async (keyword = '') => {
    const params = new URLSearchParams();
    if (keyword) params.set('search', keyword);
    params.set('limit', '30');
    try {
      const data = await apiRequest(`/sales/products?${params.toString()}`);
      if (Array.isArray(data)) {
        setProducts((prev) => mergeProducts(prev, data));
      }
    } catch (error) {
      message.error('Không thể tải danh sách sản phẩm.');
    }
  }, []);

  const activeSuppliers = useMemo(() => suppliers.filter((item) => !item.isDeleted), [suppliers]);
  const supplierOptions = useMemo(
    () => activeSuppliers.map((item) => ({ value: item.id, label: item.name })),
    [activeSuppliers]
  );
  const activeProducts = useMemo(() => products.filter((item) => !item.isDeleted), [products]);
  const supplier = suppliers.find((item) => item.id === supplierId);
  const isEdit = Boolean(editing);
  const isFullEdit = isEdit && editScope === 'full';
  const readOnlyEdit = isEdit && !isFullEdit;

  useEffect(() => {
    let cancelled = false;
    const loadDebt = async () => {
      if (!supplierId) {
        setSupplierDebt(0);
        return;
      }
      const params = new URLSearchParams({ supplierId });
      if (editing?.id) params.set('excludePurchaseId', editing.id);
      try {
        const data = await apiRequest(`/purchases-tools/supplier-debt?${params.toString()}`);
        if (!cancelled) {
          setSupplierDebt(Number(data?.debt || 0));
        }
      } catch (error) {
        if (!cancelled) {
          setSupplierDebt(0);
          message.error('Không thể tải công nợ nhà cung cấp.');
        }
      }
    };
    loadDebt();
    return () => {
      cancelled = true;
    };
  }, [supplierId, editing?.id]);

  const loadRecentPurchases = useCallback(async () => {
    const params = new URLSearchParams({ limit: '200' });
    if (filterSupplier) params.set('supplierId', filterSupplier);
    if (filterRange[0]) params.set('from', filterRange[0]);
    if (filterRange[1]) params.set('to', filterRange[1]);
    try {
      const data = await apiRequest(`/purchases-tools/recent?${params.toString()}`);
      setRecentPurchases(Array.isArray(data?.rows) ? data.rows : []);
      setExportRows(Array.isArray(data?.exportRows) ? data.exportRows : []);
    } catch (error) {
      message.error('Không thể tải phiếu nhập.');
    }
  }, [filterRange, filterSupplier]);

  useEffect(() => {
    if (!recentOpen) return;
    loadRecentPurchases();
  }, [recentOpen, loadRecentPurchases]);

  const applyEditingValues = (purchase) => {
    setSupplierId(purchase?.supplierId || '');
    setDate(purchase?.date || new Date().toISOString());
    setNote(purchase?.note || '');
    setItems(buildPurchaseItems(purchase));
    setDraftCode(purchase?.code || generateCode('PO'));
  };
  const {
    searchOpen,
    setSearchOpen,
    searchKeyword,
    setSearchKeyword,
    pendingProduct,
    pendingQty,
    pendingPrice,
    pendingLength,
    pendingWidth,
    setPendingQty,
    setPendingPrice,
    setPendingLength,
    setPendingWidth,
    handleAddProduct,
    handlePendingProductChange,
    handleConfirmAdd,
    filteredQuick,
    handleQuickAdd,
    resetSearchState,
  } = usePurchaseProductModal({
    activeProducts,
    setItems,
    readOnly: readOnlyEdit,
    onSearchProducts: handleSearchProducts,
  });
  const { updateItem: updatePurchaseItem, removeItem } = usePurchaseItems({
    items,
    setItems,
    products,
    readOnly: readOnlyEdit,
  });
  useEffect(() => {
    if (!editing) return;
    applyEditingValues(editing);
    resetSearchState();
  }, [editing, resetSearchState]);
  const totals = useMemo(
    () => items.reduce((sum, item) => sum + Number(item.lineTotal || 0), 0),
    [items]
  );
  const totalQty = useMemo(() => items.reduce((sum, item) => sum + Number(item.qty || 0), 0), [items]);
  const resetForm = () => {
    setEditing(null);
    setEditScope('payment');
    setPurchasePayments([]);
    setSupplierDebt(0);
    setSupplierId('');
    setDate(new Date().toISOString());
    setNote('');
    setItems([]);
    setDraftCode(generateCode('PO'));
    resetSearchState();
  };
  const persistPurchase = async () => {
    if (isEdit && !isFullEdit) return editing;
    if (!supplierId) {
      message.error('Chọn nhà cung cấp.');
      return null;
    }
    if (!items.length) {
      message.error('Chọn hàng hóa.');
      return null;
    }
    const normalizedItems = items.map((item) => ({
      ...item,
      qty: Number(item.qty || 0),
      unitCost: Number(item.unitCost || 0),
      length: Number(item.length || 0) > 0 ? Number(item.length) : null,
      width: Number(item.width || 0) > 0 ? Number(item.width) : null,
      lineNote: item.lineNote || '',
      lineTotal: getPurchaseLineTotal(item),
    }));
    const invalid = normalizedItems.find(
      (item) => !item.productId || Number(item.qty || 0) <= 0 || Number(item.unitCost || 0) < 0
    );
    if (invalid) {
      message.error('Số lượng > 0 và đơn giá >= 0.');
      return null;
    }
    const nextTotal = normalizedItems.reduce((sum, item) => sum + Number(item.lineTotal || 0), 0);

    if (isEdit && isFullEdit && editing?.id) {
      const payload = {
        code: draftCode,
        supplierId,
        date,
        items: normalizedItems,
        total: nextTotal,
        note,
      };
      try {
        const data = await apiRequest(`/purchases-tools/${editing.id}`, {
          method: 'PUT',
          body: payload,
        });
        if (Array.isArray(data?.products)) {
          setProducts((prev) => mergeProducts(prev, data.products));
        }
        const nextPurchase = data?.purchase || { ...payload, id: editing.id };
        setEditing(nextPurchase);
        message.success('Đã cập nhật phiếu nhập.');
        return nextPurchase;
      } catch (error) {
        message.error('Không thể cập nhật phiếu nhập.');
        return null;
      }
    }

    const purchasePayload = {
      id: uuid(),
      code: draftCode,
      supplierId,
      date,
      items: normalizedItems,
      total: nextTotal,
      note,
    };
    try {
      const data = await apiRequest('/purchases-tools', {
        method: 'POST',
        body: purchasePayload,
      });
      if (Array.isArray(data?.products)) {
        setProducts((prev) => mergeProducts(prev, data.products));
      }
      return data?.purchase || purchasePayload;
    } catch (error) {
      message.error('Không thể lưu phiếu nhập.');
      return null;
    }
  };
  const handleCancelTicket = () => {
    Modal.confirm({
      title: 'Hủy phiếu hiện tại?',
      content: 'Dữ liệu chưa lưu sẽ bị xóa.',
      okText: 'Hủy phiếu',
      cancelText: 'Giữ lại',
      onOk: () => {
        if (editing) {
          applyEditingValues(editing);
          return;
        }
        resetForm();
      },
    });
  };

  const handleAddPayment = async (payment) => {
    const payload = {
      ...payment,
      paymentType: payment.paymentType || 'purchase_payment',
      supplierId: payment.supplierId || editing?.supplierId || supplierId || '',
    };
    const created = await addItem('payments', payload);
    const nextPayment = created || payload;
    setPurchasePayments((prev) => [...prev, nextPayment]);
  };

  const handleUpdatePayment = async (paymentId, data) => {
    const existing = purchasePayments.find((payment) => payment.id === paymentId);
    const payload = {
      ...existing,
      ...data,
      paymentType: data.paymentType || existing?.paymentType || 'purchase_payment',
      supplierId: data.supplierId || existing?.supplierId || editing?.supplierId || supplierId || '',
    };
    const saved = await updateRecord('payments', paymentId, payload);
    const nextPayment = saved || payload;
    setPurchasePayments((prev) =>
      prev.map((payment) => (payment.id === paymentId ? nextPayment : payment))
    );
  };

  const handleRemovePayment = async (paymentId) => {
    await deleteItem('payments', paymentId);
    setPurchasePayments((prev) => prev.filter((payment) => payment.id !== paymentId));
  };
  const {
    supplierDebt: currentSupplierDebt,
    totalPayment,
    remainingPayment,
    purchasePayments: currentPurchasePayments,
    handleCheckout,
  } = usePurchasePayments({
    editing,
    payments: purchasePayments,
    supplierDebtOverride: supplierDebt,
    supplierId,
    totals,
    paymentAmount,
    setPaymentAmount,
    paymentMethod,
    setPaymentMethod,
    paymentNote,
    setPaymentNote,
    paymentModalOpen,
    setPaymentModalOpen,
    persistPurchase,
    persistOnEdit: isFullEdit,
    resetForm,
    addPayment: handleAddPayment,
    updatePayment: handleUpdatePayment,
    removePayment: handleRemovePayment,
  });

  const fetchPurchaseDetail = useCallback(
    async (purchaseId) => {
      const data = await apiRequest(`/purchases-tools/detail/${purchaseId}`);
      if (Array.isArray(data?.products)) {
        setProducts((prev) => mergeProducts(prev, data.products));
      }
      return data;
    },
    []
  );

  useEffect(() => {
    if (!editPurchaseId) return;
    let cancelled = false;
    const loadEditingPurchase = async () => {
      try {
        const data = await fetchPurchaseDetail(editPurchaseId);
        if (cancelled) return;
        const nextPurchase = data?.purchase || null;
        if (!nextPurchase) {
          message.error('Không tìm thấy phiếu nhập.');
          return;
        }
        setEditScope('full');
        setEditing(nextPurchase);
        setPurchasePayments(Array.isArray(data?.payments) ? data.payments : []);
      } catch (error) {
        if (!cancelled) {
          message.error('Không thể tải phiếu nhập.');
        }
      }
    };
    loadEditingPurchase();
    return () => {
      cancelled = true;
    };
  }, [editPurchaseId, fetchPurchaseDetail]);

  const handleSelectDetail = async (purchase) => {
    try {
      const data = await fetchPurchaseDetail(purchase.id);
      setDetail(data?.purchase || purchase);
      setDetailOpen(true);
    } catch (error) {
      message.error('Không thể tải chi tiết phiếu nhập.');
    }
  };

  const handleSelectPayment = async (purchase) => {
    try {
      const data = await fetchPurchaseDetail(purchase.id);
      const nextPurchase = data?.purchase || purchase;
      setEditScope('payment');
      setEditing(nextPurchase);
      setPurchasePayments(Array.isArray(data?.payments) ? data.payments : []);
      setRecentOpen(false);
      setPaymentModalOpen(true);
    } catch (error) {
      message.error('Không thể tải phiếu nhập.');
    }
  };

  const handleOpenSupplierDebtPayment = () => {
    setSupplierDebtPaymentSupplierId(supplierId || editing?.supplierId || '');
    setSupplierDebtPaymentDate(new Date().toISOString());
    setSupplierDebtPaymentAmount(0);
    setSupplierDebtPaymentMethod('cash');
    setSupplierDebtPaymentNote('');
    setSupplierDebtPaymentDebt(0);
    setSupplierDebtPaymentOpen(true);
  };

  useEffect(() => {
    if (!supplierDebtPaymentOpen || !supplierDebtPaymentSupplierId) {
      setSupplierDebtPaymentDebt(0);
      return;
    }
    let active = true;
    const loadDebt = async () => {
      try {
        const params = new URLSearchParams({ supplierId: supplierDebtPaymentSupplierId });
        const data = await apiRequest(`/purchases-tools/supplier-debt?${params.toString()}`);
        if (active) {
          setSupplierDebtPaymentDebt(Number(data?.debt || 0));
        }
      } catch (error) {
        if (active) {
          setSupplierDebtPaymentDebt(0);
          message.error('Không thể tải công nợ nhà cung cấp.');
        }
      }
    };
    loadDebt();
    return () => {
      active = false;
    };
  }, [supplierDebtPaymentOpen, supplierDebtPaymentSupplierId]);

  const handleCreateSupplierDebtPayment = async () => {
    if (!supplierDebtPaymentSupplierId) {
      message.error('Chọn nhà cung cấp.');
      return;
    }
    const amount = Number(supplierDebtPaymentAmount || 0);
    if (amount <= 0) {
      message.error('Số tiền trả nợ phải lớn hơn 0.');
      return;
    }
    setSavingSupplierDebtPayment(true);
    try {
      const payload = {
        id: uuid(),
        supplierId: supplierDebtPaymentSupplierId,
        paymentType: 'supplier_debt_payment',
        date: supplierDebtPaymentDate || new Date().toISOString(),
        method: supplierDebtPaymentMethod,
        amount,
        note: supplierDebtPaymentNote || '',
      };
      await addItem('payments', payload);
      setSupplierDebtPaymentOpen(false);
      message.success('Đã tạo phiếu trả nợ nhà cung cấp.');

      if (supplierId && supplierId === supplierDebtPaymentSupplierId) {
        const params = new URLSearchParams({ supplierId });
        if (editing?.id) params.set('excludePurchaseId', editing.id);
        const data = await apiRequest(`/purchases-tools/supplier-debt?${params.toString()}`);
        setSupplierDebt(Number(data?.debt || 0));
      }
    } catch (error) {
      message.error(`Không thể tạo phiếu trả nợ: ${error.message || 'Lỗi không xác định'}`);
    } finally {
      setSavingSupplierDebtPayment(false);
    }
  };

  return (
    <div className="page-card pos-shell">
      <InvoiceHeader
        onCancel={() => navigate('/')}
        onOpenPayment={() => setPaymentModalOpen(true)}
        onOpenDebtReceipt={handleOpenSupplierDebtPayment}
        showDebtReceipt
        debtReceiptLabel="Trả nợ NCC"
        title="NHẬP HÀNG"
        showPreview={false}
        extraActions={(
          <Button size="large" onClick={() => setRecentOpen(true)}>
            Phiếu gần đây
          </Button>
        )}
      />
      <InvoiceTopSection
        code={draftCode}
        date={date}
        onDateChange={(val) => setDate(val?.toISOString() || new Date().toISOString())}
        onCancelTicket={handleCancelTicket}
        onShowRecent={() => setRecentOpen(true)}
        onNewTicket={resetForm}
        showRecent={false}
        itemsCount={items.length}
        totalQty={totalQty}
        customerDebt={currentSupplierDebt}
        total={totals}
        customerId={supplierId}
        onCustomerChange={setSupplierId}
        customers={activeSuppliers}
        customer={supplier}
        note={note}
        onNoteChange={setNote}
        readOnly={readOnlyEdit}
        codeLabel="Phiếu"
        partnerLabel="Nhà cung cấp"
        partnerPhoneLabel="SĐT"
        partnerAddressLabel="Địa chỉ"
        itemsLabel="Tổng MH"
        qtyLabel="Tổng SL"
        debtLabel="Nợ cũ"
        totalLabel="Tổng tiền"
      />
      <InvoiceSearchBar
        searchKeyword={searchKeyword}
        onSearchKeywordChange={setSearchKeyword}
        onPressEnter={handleQuickAdd}
        onOpenSearch={() => setSearchOpen(true)}
        filteredQuick={filteredQuick}
        onQuickSelect={handleAddProduct}
        showInput
        showPrint={false}
        disabled={readOnlyEdit}
      />
      <InvoiceItemsTable
        items={items}
        products={products}
        onUpdateItem={updatePurchaseItem}
        onRemoveItem={removeItem}
        readOnly={readOnlyEdit}
        showDimensions={false}
        priceField="unitCost"
        qtyLabel="SL"
      />
      <InvoicePaymentsSection
        isEdit={isEdit}
        payments={currentPurchasePayments}
        changeLog={[]}
        title="Thanh toán"
        emptyText="Chưa có lần trả tiền."
      />

      <InvoiceProductModal
        open={searchOpen}
        onClose={() => setSearchOpen(false)}
        products={activeProducts}
        onSearchProducts={handleSearchProducts}
        pendingProduct={pendingProduct}
        pendingQty={pendingQty}
        pendingPrice={pendingPrice}
        pendingLength={pendingLength}
        pendingWidth={pendingWidth}
        onChangeProduct={handlePendingProductChange}
        onChangeQty={setPendingQty}
        onChangePrice={setPendingPrice}
        onChangeLength={setPendingLength}
        onChangeWidth={setPendingWidth}
        onConfirmAdd={handleConfirmAdd}
      />

      <PurchaseRecentModal
        open={recentOpen}
        onClose={() => setRecentOpen(false)}
        filteredPurchases={recentPurchases}
        suppliers={suppliers}
        supplierOptions={supplierOptions}
        filterRange={filterRange}
        onFilterRangeChange={setFilterRange}
        filterSupplier={filterSupplier}
        onFilterSupplierChange={setFilterSupplier}
        exportRows={exportRows}
        onSelectDetail={handleSelectDetail}
        onSelectPayment={handleSelectPayment}
      />

      <PurchaseDetailModal
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
        detail={detail}
        products={products}
      />
      <InvoicePaymentModal
        open={paymentModalOpen}
        onClose={() => setPaymentModalOpen(false)}
        title="Thanh toán nhập hàng"
        partnerLabel="Nhà cung cấp"
        paymentLabel="Đã trả"
        customerName={supplier?.name || ''}
        total={totals}
        customerDebt={currentSupplierDebt}
        totalPayment={totalPayment}
        remainingPayment={remainingPayment}
        paymentAmount={paymentAmount}
        onPaymentAmountChange={setPaymentAmount}
        onPayFull={() => setPaymentAmount(totalPayment)}
        paymentMethod={paymentMethod}
        onPaymentMethodChange={setPaymentMethod}
        paymentNote={paymentNote}
        onPaymentNoteChange={setPaymentNote}
        onCheckoutPrint={handleCheckout}
        onCheckout={handleCheckout}
      />
      <Modal
        title="Phiếu trả nợ nhà cung cấp"
        open={supplierDebtPaymentOpen}
        onCancel={() => setSupplierDebtPaymentOpen(false)}
        onOk={handleCreateSupplierDebtPayment}
        okText="Lưu phiếu trả nợ"
        cancelText="Hủy"
        confirmLoading={savingSupplierDebtPayment}
      >
        <div className="pos-payment">
          <div className="pos-payment-row">
            <span>Nhà cung cấp:</span>
            <Select
              showSearch
              optionFilterProp="label"
              placeholder="Chọn nhà cung cấp"
              value={supplierDebtPaymentSupplierId || undefined}
              onChange={(value) => setSupplierDebtPaymentSupplierId(value || '')}
              options={supplierOptions}
            />
          </div>
          <div className="pos-payment-row">
            <span>Ngày trả:</span>
            <DatePicker
              style={{ width: '100%' }}
              value={dayjs(supplierDebtPaymentDate)}
              onChange={(value) =>
                setSupplierDebtPaymentDate(
                  value ? value.endOf('day').toISOString() : new Date().toISOString()
                )
              }
              format="DD/MM/YYYY"
            />
          </div>
          <div className="pos-payment-row total">
            <span>Công nợ hiện tại:</span>
            <strong>{formatMoney(supplierDebtPaymentDebt)}</strong>
          </div>
          <div className="pos-payment-row">
            <span>Số tiền trả:</span>
            <InputNumber
              style={{ width: '100%' }}
              min={0}
              value={supplierDebtPaymentAmount}
              onChange={(value) => setSupplierDebtPaymentAmount(Number(value || 0))}
              formatter={formatNumberInput}
              parser={parseNumberInput}

            />
          </div>
          <div className="pos-payment-row">
            <span>Phương thức:</span>
            <Select
              value={supplierDebtPaymentMethod}
              onChange={(value) => setSupplierDebtPaymentMethod(value)}
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
              value={supplierDebtPaymentNote}
              onChange={(event) => setSupplierDebtPaymentNote(event.target.value)}
              placeholder="Nội dung trả nợ"
            />
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Purchases;
