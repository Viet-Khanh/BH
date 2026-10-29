import { Button } from 'antd';
import InvoiceHeader from '../../../components/invoice/InvoiceHeader.jsx';
import InvoiceItemsTable from '../../../components/invoice/itemsTable/InvoiceItemsTable.jsx';
import Slot from '../../../platform/Slot.jsx';
import { SLOTS } from '../../../platform/slots.js';
import InvoicePaymentModal from '../../../components/invoice/InvoicePaymentModal.jsx';
import InvoicePaymentsSection from '../../../components/invoice/InvoicePaymentsSection.jsx';
import InvoicePreviewModal from '../../../components/invoice/InvoicePreviewModal.jsx';
import InvoiceProductModal from '../../../components/invoice/productModal/InvoiceProductModal.jsx';
import InvoiceSearchBar from '../../../components/invoice/InvoiceSearchBar.jsx';
import InvoiceTopSection from '../../../components/invoice/InvoiceTopSection.jsx';
import SupplierDebtPaymentModal from '../../../components/SupplierDebtPaymentModal.jsx';
import { usePurchaseCheckoutKeys } from '../hooks/usePurchaseCheckoutKeys.js';
import { usePurchasePreviewHtml } from '../hooks/usePurchasePreviewHtml.js';
import { usePurchasesScreen } from '../hooks/usePurchasesScreen.js';
import PurchaseRecentDialogs from './PurchaseRecentDialogs.jsx';

const PurchasesScreen = () => {
  const {
    navigation,
    data,
    draft,
    recent,
    productSelection,
    payments,
    debtPayment,
    preview,
    actions,
    labels,
  } = usePurchasesScreen();

  const previewHtml = usePurchasePreviewHtml({ data, draft, payments });
  usePurchaseCheckoutKeys({
    open: payments.paymentModalOpen,
    checkout: payments.checkout,
  });

  return (
    <div className="page-card pos-shell">
      <InvoiceHeader
        onCancel={navigation.goBack}
        onPreview={() => preview.setOpen(true)}
        onOpenPayment={() => payments.setPaymentModalOpen(true)}
        onOpenDebtReceipt={debtPayment.openModal}
        showDebtReceipt
        debtReceiptLabel="Trả nợ NCC"
        title="NHẬP HÀNG"
        extraActions={
          <Button size="large" onClick={() => recent.setOpen(true)}>
            Phiếu gần đây
          </Button>
        }
      />
      <InvoiceTopSection
        code={draft.draftCode}
        date={draft.date}
        onDateChange={(val) =>
          draft.setDate(val?.toISOString() || new Date().toISOString())
        }
        onCancelTicket={draft.cancelTicket}
        onShowRecent={() => recent.setOpen(true)}
        onNewTicket={draft.resetForm}
        showRecent={false}
        itemsCount={draft.items.length}
        totalQty={draft.totalQty}
        customerDebt={draft.supplierDebt}
        total={draft.totals}
        customerId={draft.supplierId}
        onCustomerChange={draft.setSupplierId}
        customers={data.activeSuppliers}
        customer={draft.supplier}
        note={draft.note}
        onNoteChange={draft.setNote}
        readOnly={draft.readOnlyEdit}
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
        searchKeyword={productSelection.searchKeyword}
        onSearchKeywordChange={productSelection.setSearchKeyword}
        onPressEnter={productSelection.handleQuickAdd}
        inputPlaceholder={productSelection.searchPlaceholder}
        onOpenSearch={() => productSelection.setSearchOpen(true)}
        filteredQuick={productSelection.filteredQuick}
        onQuickSelect={productSelection.handleAddProduct}
        showInput
        showPrint={false}
        disabled={draft.readOnlyEdit}
      />
      <Slot
        name={SLOTS.purchasesItemsTable}
        fallback={InvoiceItemsTable}
        items={draft.items}
        products={data.products}
        onUpdateItem={productSelection.updateItem}
        onRemoveItem={productSelection.removeItem}
        onChangeUnit={productSelection.changeItemUnit}
        readOnly={draft.readOnlyEdit}
        priceField="unitCost"
        qtyLabel="SL"
        priceMin={undefined}
      />
      <InvoicePaymentsSection
        isEdit={draft.isEdit}
        payments={payments.list}
        changeLog={[]}
        title="Thanh toán"
        emptyText="Chưa có lần trả tiền."
      />
      <InvoiceProductModal
        open={productSelection.searchOpen}
        onClose={() => productSelection.setSearchOpen(false)}
        products={data.activeProducts}
        onSearchProducts={productSelection.searchProducts}
        pendingProduct={productSelection.pendingProduct}
        pendingQty={productSelection.pendingQty}
        pendingPrice={productSelection.pendingPrice}
        pendingLength={productSelection.pendingLength}
        pendingWidth={productSelection.pendingWidth}
        onChangeProduct={productSelection.handlePendingProductChange}
        onChangeQty={productSelection.setPendingQty}
        onChangePrice={productSelection.setPendingPrice}
        onChangeLength={productSelection.setPendingLength}
        onChangeWidth={productSelection.setPendingWidth}
        unitSelection={productSelection.unitSelection}
        onConfirmAdd={productSelection.handleConfirmAdd}
        priceMin={undefined}
      />
      <PurchaseRecentDialogs
        data={data}
        recent={recent}
        actions={actions}
        labels={labels}
      />
      <InvoicePaymentModal
        open={payments.paymentModalOpen}
        onClose={() => payments.setPaymentModalOpen(false)}
        title="Thanh toán nhập hàng"
        partnerLabel="Nhà cung cấp"
        paymentLabel="Đã trả"
        customerName={draft.supplier?.name || ''}
        total={draft.totals}
        customerDebt={draft.supplierDebt}
        totalPayment={payments.totalPayment}
        remainingPayment={payments.remainingPayment}
        paymentAmount={payments.paymentAmount}
        onPaymentAmountChange={payments.setPaymentAmount}
        onPayFull={() => payments.setPaymentAmount(payments.totalPayment)}
        paymentMethod={payments.paymentMethod}
        onPaymentMethodChange={payments.setPaymentMethod}
        paymentNote={payments.paymentNote}
        onPaymentNoteChange={payments.setPaymentNote}
        onCheckoutPrint={() => payments.checkout({ print: true })}
        onCheckout={() => payments.checkout({ print: false })}
        focusTriggerAfterClose={false}
      />
      <InvoicePreviewModal
        open={preview.open}
        onClose={() => preview.setOpen(false)}
        html={previewHtml}
      />
      <SupplierDebtPaymentModal
        open={debtPayment.open}
        onClose={() => debtPayment.setOpen(false)}
        initialSupplierId={debtPayment.supplierId}
        suppliers={data.activeSuppliers}
        onSuccess={async (paidSupplierId) => {
          if (draft.supplierId && draft.supplierId === paidSupplierId) {
            try {
              await debtPayment.refreshSupplierDebt({
                nextSupplierId: draft.supplierId,
                silent: true,
              });
            } catch (error) {
              // Keep existing UI state if refresh fails.
            }
          }
        }}
      />
    </div>
  );
};

export default PurchasesScreen;
