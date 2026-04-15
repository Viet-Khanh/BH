import ReportInvoiceFilters from './components/ReportInvoiceFilters.jsx';
import ReportInvoicePagination from './components/ReportInvoicePagination.jsx';
import ReportSalesDetailsTable from './components/ReportSalesDetailsTable.jsx';
import ReportSalesInvoicesSummary from './components/ReportSalesInvoicesSummary.jsx';
import { useReportSalesDetailsState } from './hooks/useReportSalesDetailsState.js';

const ReportSalesDetailsTab = ({ showSensitiveInfo = false }) => {
  const state = useReportSalesDetailsState({ showSensitiveInfo });

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
        exportFileName="chi-tiet-ban-hang"
        exportSheetName="ChiTiet"
        exportTitle={state.exportTitle}
      >
        <ReportSalesInvoicesSummary
          summary={state.summary}
          showSensitiveInfo={showSensitiveInfo}
        />
      </ReportInvoiceFilters>

      <ReportSalesDetailsTable
        rows={state.rows}
        showSensitiveInfo={showSensitiveInfo}
      />

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

export default ReportSalesDetailsTab;
