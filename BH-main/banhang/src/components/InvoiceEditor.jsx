import InvoiceHeader from './invoice/InvoiceHeader.jsx';
import InvoiceItemsTable from './invoice/InvoiceItemsTable.jsx';
import InvoicePaymentModal from './invoice/InvoicePaymentModal.jsx';
import InvoicePaymentsSection from './invoice/InvoicePaymentsSection.jsx';
import InvoicePreviewModal from './invoice/InvoicePreviewModal.jsx';
import InvoiceProductModal from './invoice/InvoiceProductModal.jsx';
import InvoiceSearchBar from './invoice/InvoiceSearchBar.jsx';
import InvoiceTopSection from './invoice/InvoiceTopSection.jsx';
import useInvoiceEditorState from './invoice/useInvoiceEditorState.js';

const InvoiceEditor = (props) => {
  const {
    headerProps,
    topSectionProps,
    searchProps,
    itemsTableProps,
    paymentsSectionProps,
    paymentModalProps,
    productModalProps,
    previewModalProps,
  } = useInvoiceEditorState(props);

  return (
    <div className="page-card pos-shell">
      <InvoiceHeader {...headerProps} />
      <InvoiceTopSection {...topSectionProps} />
      <InvoiceSearchBar {...searchProps} />
      <InvoiceItemsTable {...itemsTableProps} />
      <InvoicePaymentsSection {...paymentsSectionProps} />
      <InvoicePaymentModal {...paymentModalProps} />
      <InvoiceProductModal {...productModalProps} />
      <InvoicePreviewModal {...previewModalProps} />
    </div>
  );
};

export default InvoiceEditor;
