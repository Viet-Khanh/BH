import ReportPurchaseDebtTable from './components/ReportPurchaseDebtTable.jsx';
import SupplierDebtDetailModal from './components/SupplierDebtDetailModal.jsx';
import { useReportPurchaseDebtState } from './hooks/useReportPurchaseDebtState.js';

const ReportPurchaseDebtTab = () => {
  const state = useReportPurchaseDebtState();

  return (
    <div>
      <ReportPurchaseDebtTable
        exportRows={state.debtExport}
        rows={state.rows}
        onView={state.handleView}
      />

      <SupplierDebtDetailModal
        debtDetail={state.debtDetail}
        onClose={state.closeDebtDetail}
      />
    </div>
  );
};

export default ReportPurchaseDebtTab;
