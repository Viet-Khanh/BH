import { Alert, Space, Typography } from 'antd';
import { useEffect, useState } from 'react';
import { useSettingsStore } from '../../../store/settingsStore.js';
import EinvoiceDetailDrawer from '../components/detail/EinvoiceDetailDrawer.jsx';
import EinvoiceExportBar from '../components/list/EinvoiceExportBar.jsx';
import EinvoiceFilters from '../components/list/EinvoiceFilters.jsx';
import ReducedVatAlert from '../components/settings/ReducedVatAlert.jsx';
import EinvoiceTable from '../components/list/EinvoiceTable.jsx';
import { useEinvoiceDocuments } from '../hooks/useEinvoiceDocuments.js';
import { useEinvoiceExport } from '../hooks/useEinvoiceExport.js';
import { DEFAULT_PROFILE_ID } from '../profiles/index.js';

const HELP =
  'Chọn hoá đơn "Chưa xuất" → Xuất file → tải file lên mục nhập hoá đơn từ Excel trên trang nhà cung cấp hoá đơn điện tử của cửa hàng.';

// Manual e-invoice workflow: pick sales, export a provider-format file, track state.
const EinvoiceScreen = () => {
  const { settings, load: loadSettings } = useSettingsStore();
  const documents = useEinvoiceDocuments();
  const [selectedIds, setSelectedIds] = useState([]);
  const [detailItem, setDetailItem] = useState(null);
  const [profileId, setProfileId] = useState(
    settings.einvoiceProfile || DEFAULT_PROFILE_ID
  );
  const { exporting, exportItems } = useEinvoiceExport({
    onExported: documents.reload,
  });

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  useEffect(() => {
    setSelectedIds([]);
  }, [documents.items]);

  const selectedItems = documents.items.filter((item) =>
    selectedIds.includes(item.invoiceId)
  );

  return (
    <Space direction="vertical" size="middle" style={{ width: '100%' }}>
      <Typography.Text type="secondary">{HELP}</Typography.Text>
      <ReducedVatAlert settings={settings} />
      {documents.blocking.map((issue) => (
        <Alert
          key={issue.message}
          type="error"
          showIcon
          message={issue.message}
        />
      ))}
      <EinvoiceFilters
        filters={documents.filters}
        onChange={documents.updateFilters}
        onReload={documents.reload}
        loading={documents.loading}
      />
      <EinvoiceExportBar
        profileId={profileId}
        onProfileChange={setProfileId}
        selectedCount={selectedIds.length}
        disabled={documents.blocking.length > 0}
        exporting={exporting}
        onExport={() => exportItems(selectedItems, profileId)}
      />
      <EinvoiceTable
        items={documents.items}
        loading={documents.loading}
        selectedIds={selectedIds}
        onSelect={setSelectedIds}
        onChanged={documents.reload}
        onOpen={setDetailItem}
      />
      <EinvoiceDetailDrawer
        item={detailItem}
        onClose={() => setDetailItem(null)}
      />
    </Space>
  );
};

export default EinvoiceScreen;
