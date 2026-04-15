import ReportInvoiceFilters from './components/ReportInvoiceFilters.jsx';
import ReportInvoicePagination from './components/ReportInvoicePagination.jsx';
import ReportPurchaseDetailsSummary from './components/ReportPurchaseDetailsSummary.jsx';
import ReportPurchaseDetailsTable from './components/ReportPurchaseDetailsTable.jsx';
import { useReportPurchaseDetailsState } from './hooks/useReportPurchaseDetailsState.js';

const ReportPurchaseDetailsTab = () => {
  const state = useReportPurchaseDetailsState();

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
        pdfRows={state.pdfRows}
        exportFileName="chi-tiet-nhap-hang"
        exportSheetName="ChiTietNhap"
        exportTitle={state.exportTitle}
      >
        <ReportPurchaseDetailsSummary summary={state.summary} />
      </ReportInvoiceFilters>

      <ReportPurchaseDetailsTable rows={state.groupedRows} />

      <ReportInvoicePagination
        page={state.page}
        pageSize={state.pageSize}
        total={state.total}
        setPage={state.setPage}
        setPageSize={state.setPageSize}
      />
    </div>
  );
};

export default ReportPurchaseDetailsTab;
