import LabelPrintModal from '../../printing/components/LabelPrintModal.jsx';
import PurchaseDetailModal from '../../../pages/Purchases/PurchaseDetailModal.jsx';
import PurchaseRecentModal from '../../../pages/Purchases/PurchaseRecentModal.jsx';

// Recent purchases list, purchase detail and the label confirm list.
const PurchaseRecentDialogs = ({ data, recent, actions, labels }) => (
  <>
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
      onPrintLabels={labels.printDetailLabels}
    />
    <LabelPrintModal {...labels} />
  </>
);

export default PurchaseRecentDialogs;
