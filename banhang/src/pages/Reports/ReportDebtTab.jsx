import { useEffect } from 'react';
import { useSettingsStore } from '../../store/settingsStore.js';
import CustomerDebtDetailModal from './components/CustomerDebtDetailModal.jsx';
import DebtReceiptEditorModal from './components/DebtReceiptEditorModal.jsx';
import ReportDebtTable from './components/ReportDebtTable.jsx';
import { useDebtReceiptDeletion } from './hooks/useDebtReceiptDeletion.js';
import { useDebtReceiptEditor } from './hooks/useDebtReceiptEditor.js';
import { useReportDebtState } from './hooks/useReportDebtState.js';
import { formatDebtPaymentMethod } from './reportDebtUtils.js';

const ReportDebtTab = () => {
  const { settings, load: loadSettings } = useSettingsStore();
  const state = useReportDebtState();
  const editor = useDebtReceiptEditor({
    debtDetail: state.debtDetail,
    debtTimelineRows: state.debtTimelineRows,
    loadDebtRows: state.loadDebtRows,
    loadDebtDetail: state.loadDebtDetail,
    loadDebtTimeline: state.loadDebtTimeline,
    settings,
  });
  const deletion = useDebtReceiptDeletion({
    debtDetail: state.debtDetail,
    loadDebtRows: state.loadDebtRows,
    loadDebtDetail: state.loadDebtDetail,
    loadDebtTimeline: state.loadDebtTimeline,
  });

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  return (
    <div>
      <ReportDebtTable
        keyword={state.keyword}
        onKeywordChange={state.setKeyword}
        exportRows={state.debtExport}
        summaryItems={state.summaryItems}
        rows={state.filteredRows}
        onView={state.handleView}
      />

      <CustomerDebtDetailModal
        debtDetail={state.debtDetail}
        debtDetailTab={state.debtDetailTab}
        setDebtDetailTab={state.setDebtDetailTab}
        onClose={() => {
          state.closeDebtDetail();
          editor.resetEditor();
        }}
        onOpenEditDebtReceipt={editor.openEditDebtReceipt}
        onReprintDebtReceipt={editor.reprintDebtReceipt}
        onDeleteDebtReceipt={deletion.deleteDebtReceipt}
        deletingDebtReceiptId={deletion.deletingDebtReceiptId}
        formatPaymentMethod={formatDebtPaymentMethod}
      />

      <DebtReceiptEditorModal
        editingDebtReceipt={editor.editingDebtReceipt}
        customerName={state.debtDetail?.customer?.name || ''}
        editingDebtReceiptDate={editor.editingDebtReceiptDate}
        setEditingDebtReceiptDate={editor.setEditingDebtReceiptDate}
        editingDebtReceiptAmount={editor.editingDebtReceiptAmount}
        setEditingDebtReceiptAmount={editor.setEditingDebtReceiptAmount}
        editingDebtReceiptMethod={editor.editingDebtReceiptMethod}
        setEditingDebtReceiptMethod={editor.setEditingDebtReceiptMethod}
        editingDebtReceiptNote={editor.editingDebtReceiptNote}
        setEditingDebtReceiptNote={editor.setEditingDebtReceiptNote}
        editingDebtReceiptTimelineRow={editor.editingDebtReceiptTimelineRow}
        onClose={editor.closeEditDebtReceipt}
        onSave={editor.saveDebtReceipt}
        savingDebtReceipt={editor.savingDebtReceipt}
        debtReceiptSubmitMode={editor.debtReceiptSubmitMode}
      />
    </div>
  );
};

export default ReportDebtTab;
