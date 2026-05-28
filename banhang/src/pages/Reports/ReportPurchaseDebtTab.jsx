import { useEffect } from 'react';
import { useSettingsStore } from '../../store/settingsStore.js';
import DebtReceiptEditorModal from './components/DebtReceiptEditorModal.jsx';
import ReportPurchaseDebtTable from './components/ReportPurchaseDebtTable.jsx';
import SupplierDebtDetailModal from './components/SupplierDebtDetailModal.jsx';
import { useReportPurchaseDebtState } from './hooks/useReportPurchaseDebtState.js';
import { useSupplierDebtPaymentDeletion } from './hooks/useSupplierDebtPaymentDeletion.js';
import { useSupplierDebtPaymentEditor } from './hooks/useSupplierDebtPaymentEditor.js';
import { formatDebtPaymentMethod } from './reportDebtUtils.js';

const ReportPurchaseDebtTab = () => {
  const { settings, load: loadSettings } = useSettingsStore();
  const state = useReportPurchaseDebtState();
  const editor = useSupplierDebtPaymentEditor({
    debtDetail: state.debtDetail,
    loadSupplierDebtRows: state.loadSupplierDebtRows,
    loadSupplierDebtDetail: state.loadSupplierDebtDetail,
    settings,
  });
  const deletion = useSupplierDebtPaymentDeletion({
    debtDetail: state.debtDetail,
    loadSupplierDebtRows: state.loadSupplierDebtRows,
    loadSupplierDebtDetail: state.loadSupplierDebtDetail,
  });

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  return (
    <div>
      <ReportPurchaseDebtTable
        exportRows={state.debtExport}
        rows={state.rows}
        onView={state.handleView}
      />

      <SupplierDebtDetailModal
        debtDetail={state.debtDetail}
        debtDetailTab={state.debtDetailTab}
        setDebtDetailTab={state.setDebtDetailTab}
        onClose={() => {
          state.closeDebtDetail();
          editor.resetEditor();
        }}
        onOpenEditDebtPayment={editor.openEditDebtPayment}
        onReprintDebtPayment={editor.reprintDebtPayment}
        onDeleteDebtPayment={deletion.deleteDebtPayment}
        deletingDebtPaymentId={deletion.deletingDebtPaymentId}
        formatPaymentMethod={formatDebtPaymentMethod}
      />

      <DebtReceiptEditorModal
        editingDebtReceipt={editor.editingDebtPayment}
        partnerName={state.debtDetail?.supplier?.name || ''}
        editingDebtReceiptDate={editor.editingDebtPaymentDate}
        setEditingDebtReceiptDate={editor.setEditingDebtPaymentDate}
        editingDebtReceiptAmount={editor.editingDebtPaymentAmount}
        setEditingDebtReceiptAmount={editor.setEditingDebtPaymentAmount}
        editingDebtReceiptMethod={editor.editingDebtPaymentMethod}
        setEditingDebtReceiptMethod={editor.setEditingDebtPaymentMethod}
        editingDebtReceiptNote={editor.editingDebtPaymentNote}
        setEditingDebtReceiptNote={editor.setEditingDebtPaymentNote}
        editingDebtReceiptTimelineRow={editor.editingDebtPaymentTimelineRow}
        onClose={editor.closeEditDebtPayment}
        onSave={editor.saveDebtPayment}
        savingDebtReceipt={editor.savingDebtPayment}
        debtReceiptSubmitMode={editor.debtPaymentSubmitMode}
        title="Sửa phiếu trả nợ"
        partnerLabel="Nhà cung cấp:"
        dateLabel="Ngày trả:"
        amountLabel="Số tiền trả:"
        notePlaceholder="Nội dung trả nợ"
      />
    </div>
  );
};

export default ReportPurchaseDebtTab;
