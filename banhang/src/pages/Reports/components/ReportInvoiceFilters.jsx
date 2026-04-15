import { Select } from 'antd';
import DateRangeFilter from '../../../components/DateRangeFilter.jsx';
import ExportActions from '../../../components/ExportActions.jsx';

const ReportInvoiceFilters = ({
  range,
  onRangeChange,
  entityLabel,
  entityPlaceholder,
  entityValue,
  onEntityChange,
  entityOptions = [],
  exportRows = [],
  pdfRows,
  exportFileName,
  exportSheetName,
  exportTitle,
  children,
}) => (
  <div className="action-row">
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <span style={{ fontWeight: 600 }}>Theo ngày</span>
      <DateRangeFilter value={range} onChange={onRangeChange} />
    </div>
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <span style={{ fontWeight: 600 }}>{entityLabel}</span>
      <Select
        allowClear
        placeholder={entityPlaceholder}
        value={entityValue || undefined}
        onChange={(value) => onEntityChange(value || '')}
        options={entityOptions}
        style={{ minWidth: 220 }}
        size="large"
        showSearch
        optionFilterProp="label"
      />
    </div>
    <div
      style={{
        display: 'flex',
        alignItems: 'end',
        marginLeft: children ? undefined : 'auto',
      }}
    >
      <ExportActions
        rows={exportRows}
        pdfRows={pdfRows}
        fileName={exportFileName}
        sheetName={exportSheetName}
        title={exportTitle}
      />
    </div>
    {children ? (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          marginLeft: 'auto',
          justifyContent: 'flex-end',
          gap: 8,
        }}
      >
        {children}
      </div>
    ) : null}
  </div>
);

export default ReportInvoiceFilters;
