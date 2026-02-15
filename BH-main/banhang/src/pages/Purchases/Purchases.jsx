import { useCallback, useEffect, useMemo, useState } from 'react';
import { Button, Modal, message } from 'antd';
import { useNavigate } from 'react-router-dom';
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
import { addItem, apiRequest, deleteItem, updateItem } from '../../db/repository.js';
const buildPurchaseItems = (purchase) =>
  (purchase?.items || []).map((item) => ({
    ...item,
    lineNote: item.lineNote || '',
  }));

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
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [paymentNote, setPaymentNote] = useState('');

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
    isEdit,
    onSearchProducts: handleSearchProducts,
  });
  const { updateItem, removeItem } = usePurchaseItems({
    items,
    setItems,
    products,
    isEdit,
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
    if (isEdit) {
      message.warning('Phiếu đã lưu, không thể chỉnh sửa.');
      return null;
    }
    if (!supplierId) {
      message.error('Chọn nhà cung cấp.');
      return null;
    }
    if (!items.length) {
      message.error('Chọn hàng hóa.');
      return null;
    }
    const invalid = items.find((item) => Number(item.qty || 0) <= 0 || Number(item.unitCost || 0) < 0);
    if (invalid) {
      message.error('Số lượng > 0 và đơn giá >= 0.');
      return null;
    }
    const purchasePayload = {
      id: uuid(),
      code: draftCode,
      supplierId,
      date,
      items,
      total: totals,
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
    const created = await addItem('payments', payment);
    const nextPayment = created || payment;
    setPurchasePayments((prev) => [...prev, nextPayment]);
  };

  const handleUpdatePayment = async (paymentId, data) => {
    const saved = await updateItem('payments', paymentId, data);
    const nextPayment = saved || data;
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
      setEditing(nextPurchase);
      setPurchasePayments(Array.isArray(data?.payments) ? data.payments : []);
      setRecentOpen(false);
      setPaymentModalOpen(true);
    } catch (error) {
      message.error('Không thể tải phiếu nhập.');
    }
  };

  return (
    <div className="page-card pos-shell">
      <InvoiceHeader
        onCancel={() => navigate('/')}
        onOpenPayment={() => setPaymentModalOpen(true)}
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
        readOnly={isEdit}
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
        disabled={isEdit}
      />
      <InvoiceItemsTable
        items={items}
        products={products}
        onUpdateItem={updateItem}
        onRemoveItem={removeItem}
        readOnly={isEdit}
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
    </div>
  );
};

export default Purchases;
