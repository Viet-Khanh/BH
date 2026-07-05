import InvoiceEditor from '../../../components/InvoiceEditor.jsx';
import CustomerDebtReceiptModal from '../../../components/CustomerDebtReceiptModal.jsx';
import { useSalesScreen } from '../hooks/useSalesScreen.js';

const SalesScreen = () => {
  const { navigation, data, invoice, debtReceipt, actions } = useSalesScreen();

  return (
    <div>
      <InvoiceEditor
        invoice={invoice.editing}
        draftInvoice={invoice.draft}
        customers={data.customers}
        invoices={data.invoices}
        products={data.products}
        payments={invoice.editing ? invoice.payments : []}
        settings={data.settings}
        customerDebtOverride={invoice.customerDebt}
        onSearchProducts={actions.searchProducts}
        onCreateProduct={actions.createProduct}
        onCustomerChange={actions.refreshCustomerDebt}
        onSave={actions.saveInvoice}
        onCancel={navigation.cancel}
        onOpenDebtReceipt={debtReceipt.openModal}
        onAddPayment={actions.addPayment}
        onUpdatePayment={actions.updatePayment}
        onRemovePayment={actions.removePayment}
        onShowRecent={() => {
          navigation.navigate('/sales/recent');
        }}
        onShowDebt={() => {
          navigation.navigate('/sales/recent?debt=1');
        }}
        onShowTemplate={() => navigation.navigate('/system')}
        onNewInvoice={actions.newInvoice}
      />
      <CustomerDebtReceiptModal
        open={debtReceipt.open}
        onClose={() => debtReceipt.setOpen(false)}
        initialCustomerId={debtReceipt.customerId}
        customers={data.activeCustomers}
        settings={data.settings}
        onSuccess={debtReceipt.handleSuccess}
      />
    </div>
  );
};

export default SalesScreen;
