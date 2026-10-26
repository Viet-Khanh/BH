import { Alert, Button, Space, Typography } from 'antd';
import { useEffect, useState } from 'react';
import EinvoiceDetailDrawer from '../components/detail/EinvoiceDetailDrawer.jsx';
import EinvoiceExportBar from '../components/list/EinvoiceExportBar.jsx';
import EinvoiceFilters from '../components/list/EinvoiceFilters.jsx';
import EinvoiceTable from '../components/list/EinvoiceTable.jsx';
import ResultImportModal from '../components/results/ResultImportModal.jsx';
import ReducedVatAlert from '../components/settings/ReducedVatAlert.jsx';
import { useEinvoiceDocuments } from '../hooks/useEinvoiceDocuments.js';
import { useEinvoiceExport } from '../hooks/useEinvoiceExport.js';
import { useExportProfiles } from '../hooks/useExportProfiles.js';

const HELP = {
  issue:
    'Chọn hoá đơn "Chưa xuất" → Xuất file → tải file lên mục nhập hoá đơn từ Excel trên trang nhà cung cấp hoá đơn điện tử.',
  adjust:
    'Hoá đơn sửa/xoá sau khi xuất: xem chi tiết thay đổi, xuất file điều chỉnh/thay thế rồi lập trên trang nhà cung cấp.',
};

// The selectable status for each export purpose.
const PURPOSE_BY_STATUS = { pending: 'issue', changed: 'adjust' };

// List of sales with their e-invoice state; export / adjust / record numbers.
const InvoicesTab = ({ settings }) => {
  const documents = useEinvoiceDocuments();
  const profiles = useExportProfiles(settings);
  const [selectedIds, setSelectedIds] = useState([]);
  const [detailItem, setDetailItem] = useState(null);
  const [resultsOpen, setResultsOpen] = useState(false);
  const { exporting, exportItems } = useEinvoiceExport({
    settings,
    onExported: documents.reload,
  });
  const purpose = PURPOSE_BY_STATUS[documents.filters.status] || 'issue';
  const selectableStatus = purpose === 'adjust' ? 'changed' : 'pending';

  useEffect(() => {
    setSelectedIds([]);
  }, [documents.items]);

  const selectedItems = documents.items.filter((item) =>
    selectedIds.includes(item.invoiceId)
  );

  return (
    <Space direction="vertical" size="middle" style={{ width: '100%' }}>
      <Typography.Text type="secondary">{HELP[purpose]}</Typography.Text>
      <ReducedVatAlert settings={settings} />
      {documents.blocking.map((issue) => (
        <Alert
          key={issue.message}
          type="error"
          showIcon
          message={issue.message}
        />
      ))}
      <Space wrap style={{ justifyContent: 'space-between', width: '100%' }}>
        <EinvoiceFilters
          filters={documents.filters}
          onChange={documents.updateFilters}
          onReload={documents.reload}
          loading={documents.loading}
        />
        <Button onClick={() => setResultsOpen(true)}>
          Nhập kết quả từ nhà cung cấp
        </Button>
      </Space>
      <EinvoiceExportBar
        purpose={purpose}
        profileOptions={profiles.optionsFor(purpose)}
        profileId={profiles.profileIdFor(purpose)}
        onProfileChange={(profileId) => profiles.choose(purpose, profileId)}
        selectedCount={selectedIds.length}
        disabled={documents.blocking.length > 0}
        exporting={exporting}
        onExport={() =>
          exportItems(selectedItems, profiles.profileIdFor(purpose), purpose)
        }
      />
      <EinvoiceTable
        items={documents.items}
        loading={documents.loading}
        selectableStatus={selectableStatus}
        selectedIds={selectedIds}
        onSelect={setSelectedIds}
        onChanged={documents.reload}
        onOpen={setDetailItem}
      />
      <ResultImportModal
        open={resultsOpen}
        onClose={() => setResultsOpen(false)}
        onApplied={documents.reload}
      />
      <EinvoiceDetailDrawer
        item={detailItem}
        onClose={() => setDetailItem(null)}
      />
    </Space>
  );
};

export default InvoicesTab;
