import { useEffect } from 'react';
import { useSettingsStore } from '../../store/settingsStore.js';
import ReportInvoiceFilters from './components/ReportInvoiceFilters.jsx';
import ReportInvoicePagination from './components/ReportInvoicePagination.jsx';
import ReportSalesInvoicesSummary from './components/ReportSalesInvoicesSummary.jsx';
import ReportSalesInvoicesTable from './components/ReportSalesInvoicesTable.jsx';
import { useReportSalesInvoiceModal } from './hooks/useReportSalesInvoiceModal.js';
import { useReportSalesInvoicesState } from './hooks/useReportSalesInvoicesState.js';
import ReportSalesInvoiceModal from './ReportSalesInvoiceModal.jsx';

const ReportSalesInvoicesTab = ({ showSensitiveInfo = false }) => {
  const { settings, load: loadSettings } = useSettingsStore();
  const state = useReportSalesInvoicesState({ showSensitiveInfo });
  const modal = useReportSalesInvoiceModal({
    location: state.location,
    navigate: state.navigate,
    refreshReport: state.refreshReport,
    settings,
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
        entityLabel="Khách hàng"
        entityPlaceholder="Chọn khách hàng"
        entityValue={state.entityId}
        onEntityChange={(value) => {
          state.setEntityId(value);
          state.setPage(1);
        }}
        entityOptions={state.customers.map((item) => ({
          value: item.id,
          label: item.name,
        }))}
        exportRows={state.exportRows}
        pdfRows={state.pdfRows}
        exportFileName="hoa-don-ban-hang"
        exportSheetName="HoaDon"
        exportTitle={state.exportTitle}
      >
        <ReportSalesInvoicesSummary
          summary={state.summary}
          showSensitiveInfo={showSensitiveInfo}
        />
      </ReportInvoiceFilters>

      <ReportSalesInvoicesTable
        rows={state.displayRows}
        showSensitiveInfo={showSensitiveInfo}
        debtTimelineLoading={state.debtTimelineLoading}
        onSelectInvoice={modal.openInvoice}
      />

      <ReportInvoicePagination
        page={state.page}
        pageSize={state.pageSize}
        total={state.total}
        setPage={state.setPage}
        setPageSize={state.setPageSize}
      />

      <ReportSalesInvoiceModal
        open={!!modal.selectedInvoice}
        invoice={modal.selectedInvoice}
        customer={modal.selectedCustomer}
        items={modal.selectedItems}
        onClose={modal.closeInvoice}
        onCopy={modal.handleCopy}
        onDelete={modal.handleDelete}
        onEdit={modal.handleEdit}
        onPrint={modal.handlePrint}
        onExport={modal.handleExport}
      />
    </div>
  );
};

export default ReportSalesInvoicesTab;
