import { useEffect, useMemo, useState } from 'react';
import { Button, Modal, message } from 'antd';
import { useNavigate } from 'react-router-dom';
import { v4 as uuid } from 'uuid';
import { useSupplierStore } from '../../store/supplierStore.js';
import { useProductStore } from '../../store/productStore.js';
import { usePurchaseStore } from '../../store/purchaseStore.js';
import { useInvoiceStore } from '../../store/invoiceStore.js';
import { usePaymentStore } from '../../store/paymentStore.js';
import InvoiceHeader from '../../components/invoice/InvoiceHeader.jsx';
import InvoiceTopSection from '../../components/invoice/InvoiceTopSection.jsx';
import InvoicePaymentModal from '../../components/invoice/InvoicePaymentModal.jsx';
import InvoicePaymentsSection from '../../components/invoice/InvoicePaymentsSection.jsx';
import InvoiceItemsTable from '../../components/invoice/InvoiceItemsTable.jsx';
import InvoiceSearchBar from '../../components/invoice/InvoiceSearchBar.jsx';
import InvoiceProductModal from '../../components/invoice/InvoiceProductModal.jsx';
import PurchaseRecentModal from './PurchaseRecentModal.jsx';
import PurchaseDetailModal from './PurchaseDetailModal.jsx';
import usePurchaseFilters from './usePurchaseFilters.js';
import usePurchaseItems from './usePurchaseItems.js';
import usePurchasePayments from './usePurchasePayments.js';
import usePurchaseProductModal from './usePurchaseProductModal.js';
import { computeStock } from '../../utils/computeStock.js';
import { computeAvgCost } from '../../utils/computeAvgCost.js';
import { generateCode } from '../../utils/codeGenerator.js';
const buildPurchaseItems = (purchase) =>
  (purchase?.items || []).map((item) => ({
    ...item,
    lineNote: item.lineNote || '',
  }));
const Purchases = () => {
  const navigate = useNavigate();
  const { items: suppliers } = useSupplierStore();
  const { items: products, update: updateProduct } = useProductStore();
  const { items: purchases, add: addPurchase } = usePurchaseStore();
  const { items: invoices } = useInvoiceStore();
  const { items: payments, add: addPayment, update: updatePayment, remove: removePayment } = usePaymentStore();
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
  const activeSuppliers = useMemo(() => suppliers.filter((item) => !item.isDeleted), [suppliers]);
  const supplierOptions = useMemo(
    () => activeSuppliers.map((item) => ({ value: item.id, label: item.name })),
    [activeSuppliers]
  );
  const activeProducts = useMemo(() => products.filter((item) => !item.isDeleted), [products]);
  const supplier = suppliers.find((item) => item.id === supplierId);
  const isEdit = Boolean(editing);

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
  const { filteredPurchases, exportRows } = usePurchaseFilters({
    purchases,
    filterSupplier,
    filterRange,
    suppliers,
    products,
  });
  const totals = useMemo(
    () => items.reduce((sum, item) => sum + Number(item.lineTotal || 0), 0),
    [items]
  );
  const totalQty = useMemo(() => items.reduce((sum, item) => sum + Number(item.qty || 0), 0), [items]);
  const resetForm = () => {
    setEditing(null);
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
    const purchase = {
      id: uuid(),
      code: draftCode,
      supplierId,
      date,
      items,
      total: totals,
      note,
      appliedToStock: true,
    };
    for (const item of items) {
      const product = products.find((p) => p.id === item.productId);
      if (!product) continue;
      const oldQty = computeStock(product.id, purchases, invoices, null, products);
      const newAvgCost = computeAvgCost(oldQty, product.avgCost || 0, item.qty, item.unitCost);
      const nextOpeningStock = Number(product.openingStock || 0) + Number(item.qty || 0);
      await updateProduct(product.id, { avgCost: newAvgCost, openingStock: nextOpeningStock });
    }
    await addPurchase(purchase);
    return purchase;
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
  const {
    supplierDebt,
    totalPayment,
    remainingPayment,
    purchasePayments,
    handleCheckout,
  } = usePurchasePayments({
    editing,
    payments,
    purchases,
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
    addPayment,
    updatePayment,
    removePayment,
  });

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
        customerDebt={supplierDebt}
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
        payments={purchasePayments}
        changeLog={[]}
        title="Thanh toán"
        emptyText="Chưa có lần trả tiền."
      />

      <InvoiceProductModal
        open={searchOpen}
        onClose={() => setSearchOpen(false)}
        products={activeProducts}
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
        showDimensions={false}
      />

      <PurchaseRecentModal
        open={recentOpen}
        onClose={() => setRecentOpen(false)}
        filteredPurchases={filteredPurchases}
        suppliers={suppliers}
        supplierOptions={supplierOptions}
        filterRange={filterRange}
        onFilterRangeChange={setFilterRange}
        filterSupplier={filterSupplier}
        onFilterSupplierChange={setFilterSupplier}
        exportRows={exportRows}
        onSelectDetail={(purchase) => {
          setDetail(purchase);
          setDetailOpen(true);
        }}
        onSelectPayment={(purchase) => {
          setEditing(purchase);
          setRecentOpen(false);
          setPaymentModalOpen(true);
        }}
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
        customerDebt={supplierDebt}
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
