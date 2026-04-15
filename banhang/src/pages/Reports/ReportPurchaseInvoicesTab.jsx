import { useEffect } from 'react';
import ReportPurchaseInvoiceModal from './ReportPurchaseInvoiceModal.jsx';
import { useSettingsStore } from '../../store/settingsStore.js';
import ReportInvoiceFilters from './components/ReportInvoiceFilters.jsx';
import ReportInvoicePagination from './components/ReportInvoicePagination.jsx';
import ReportPurchaseInvoicesTable from './components/ReportPurchaseInvoicesTable.jsx';
import { useReportPurchaseInvoiceModal } from './hooks/useReportPurchaseInvoiceModal.js';
import { useReportPurchaseInvoicesState } from './hooks/useReportPurchaseInvoicesState.js';

const ReportPurchaseInvoicesTab = () => {
  const { settings, load: loadSettings } = useSettingsStore();
  const state = useReportPurchaseInvoicesState();
  const modal = useReportPurchaseInvoiceModal({
    location: state.location,
    navigate: state.navigate,
    refreshReport: state.refreshReport,
    settings,
    supplierMap: state.supplierMap,
  });

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  return (
    <div>
      <ReportInvoiceFilters
        range={state.range}
        onRangeChange={(nextRange) => {
          state.setRange(nextRange);
          state.setPage(1);
        }}
        entityLabel="Nhà cung cấp"
        entityPlaceholder="Chọn nhà cung cấp"
        entityValue={state.entityId}
        onEntityChange={(value) => {
          state.setEntityId(value);
          state.setPage(1);
        }}
        entityOptions={state.supplierOptions}
        exportRows={state.exportRows}
        exportFileName="hoa-don-nhap-hang"
        exportSheetName="HoaDonNhap"
        exportTitle={state.exportTitle}
      />

      <ReportPurchaseInvoicesTable
        rows={state.rows}
        supplierMap={state.supplierMap}
        onSelectPurchase={modal.openPurchase}
      />

      <ReportInvoicePagination
        page={state.page}
        pageSize={state.pageSize}
        total={state.total}
        setPage={state.setPage}
        setPageSize={state.setPageSize}
      />

      <ReportPurchaseInvoiceModal
        open={!!modal.selectedPurchase}
        purchase={modal.selectedPurchase}
        supplier={modal.supplier}
        items={modal.selectedItems}
        onClose={modal.closePurchase}
        onDelete={modal.handleDelete}
        onEdit={modal.handleEdit}
        onPrint={modal.handlePrint}
        onExport={modal.handleExport}
      />
    </div>
  );
};

export default ReportPurchaseInvoicesTab;
