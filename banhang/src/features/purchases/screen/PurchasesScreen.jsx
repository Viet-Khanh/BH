import { useMemo } from 'react';
import { Button } from 'antd';
import InvoiceHeader from '../../../components/invoice/InvoiceHeader.jsx';
import InvoiceTopSection from '../../../components/invoice/InvoiceTopSection.jsx';
import InvoicePaymentModal from '../../../components/invoice/InvoicePaymentModal.jsx';
import InvoicePaymentsSection from '../../../components/invoice/InvoicePaymentsSection.jsx';
import InvoiceItemsTable from '../../../components/invoice/InvoiceItemsTable.jsx';
import InvoiceSearchBar from '../../../components/invoice/InvoiceSearchBar.jsx';
import InvoiceProductModal from '../../../components/invoice/InvoiceProductModal.jsx';
import InvoicePreviewModal from '../../../components/invoice/InvoicePreviewModal.jsx';
import SupplierDebtPaymentModal from '../../../components/SupplierDebtPaymentModal.jsx';
import PurchaseRecentModal from '../../../pages/Purchases/PurchaseRecentModal.jsx';
import PurchaseDetailModal from '../../../pages/Purchases/PurchaseDetailModal.jsx';
import { renderInvoiceTemplate } from '../../../utils/renderTemplate.js';
import { buildPurchasePreviewInvoice } from '../domain/purchasesDomain.js';
import { usePurchasesScreen } from '../hooks/usePurchasesScreen.js';

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
  } = usePurchasesScreen();

  const previewHtml = useMemo(() => {
    if (!data.settings) return '';
    return renderInvoiceTemplate({
      template: data.settings.invoiceTemplateHtml,
      invoice: buildPurchasePreviewInvoice({
        code: draft.draftCode,
        date: draft.date,
        note: draft.note,
        total: draft.totals,
        supplierDebt: draft.supplierDebt,
        items: draft.items,
      }),
      customer: draft.supplier || { name: 'Nhà cung cấp' },
      payments: payments.list,
      products: data.products,
      settings: data.settings,
    });
  }, [
    data.products,
    data.settings,
    draft.date,
    draft.draftCode,
    draft.items,
    draft.note,
    draft.supplier,
    draft.supplierDebt,
    draft.totals,
    payments.list,
  ]);

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
        onOpenSearch={() => productSelection.setSearchOpen(true)}
        filteredQuick={productSelection.filteredQuick}
        onQuickSelect={productSelection.handleAddProduct}
        showInput
        showPrint={false}
        disabled={draft.readOnlyEdit}
      />
      <InvoiceItemsTable
        items={draft.items}
        products={data.products}
        onUpdateItem={productSelection.updateItem}
        onRemoveItem={productSelection.removeItem}
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
        onConfirmAdd={productSelection.handleConfirmAdd}
        priceMin={undefined}
      />
      <PurchaseRecentModal
        open={recent.open}
        onClose={() => recent.setOpen(false)}
        filteredPurchases={recent.purchases}
        suppliers={data.suppliers}
        supplierOptions={data.supplierOptions}
        filterRange={recent.filterRange}
        onFilterRangeChange={recent.setFilterRange}
        filterSupplier={recent.filterSupplier}
        onFilterSupplierChange={recent.setFilterSupplier}
        exportRows={recent.exportRows}
        onSelectDetail={actions.selectDetail}
        onSelectPayment={actions.selectPayment}
      />
      <PurchaseDetailModal
        open={recent.detailOpen}
        onClose={() => recent.setDetailOpen(false)}
        detail={recent.detail}
        products={data.products}
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
        onCheckoutPrint={payments.checkout}
        onCheckout={payments.checkout}
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
