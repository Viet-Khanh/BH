import { useCallback, useState } from 'react';
import { message } from 'antd';
import { updatePaymentRecord } from '../../../features/reports/api/reportsApi.js';
import {
  findDebtReceiptTimelineRow,
  printDebtReceiptDocument,
  refreshDebtReceiptContext,
} from '../reportDebtReceiptActions.js';

export const useDebtReceiptEditor = ({
  debtDetail,
  debtTimelineRows,
  loadDebtRows,
  loadDebtDetail,
  loadDebtTimeline,
  settings,
}) => {
  const [editingDebtReceipt, setEditingDebtReceipt] = useState(null);
  const [editingDebtReceiptTimelineRow, setEditingDebtReceiptTimelineRow] =
    useState(null);
  const [editingDebtReceiptDate, setEditingDebtReceiptDate] = useState('');
  const [editingDebtReceiptAmount, setEditingDebtReceiptAmount] = useState(0);
  const [editingDebtReceiptMethod, setEditingDebtReceiptMethod] =
    useState('cash');
  const [editingDebtReceiptNote, setEditingDebtReceiptNote] = useState('');
  const [savingDebtReceipt, setSavingDebtReceipt] = useState(false);
  const [debtReceiptSubmitMode, setDebtReceiptSubmitMode] = useState('');

  const resetEditor = useCallback(() => {
    setEditingDebtReceipt(null);
    setEditingDebtReceiptTimelineRow(null);
    setEditingDebtReceiptDate('');
    setEditingDebtReceiptAmount(0);
    setEditingDebtReceiptMethod('cash');
    setEditingDebtReceiptNote('');
    setDebtReceiptSubmitMode('');
  }, []);

  const openEditDebtReceipt = useCallback(
    (payment) => {
      const timelineRow = findDebtReceiptTimelineRow(
        debtTimelineRows,
        payment.id
      );
      setEditingDebtReceipt(payment);
      setEditingDebtReceiptTimelineRow(timelineRow);
      setEditingDebtReceiptDate(payment.date || new Date().toISOString());
      setEditingDebtReceiptAmount(Number(payment.amount || 0));
      setEditingDebtReceiptMethod(payment.method || 'cash');
      setEditingDebtReceiptNote(payment.note || '');
    },
    [debtTimelineRows]
  );

  const closeEditDebtReceipt = useCallback(() => {
    if (savingDebtReceipt) return;
    resetEditor();
  }, [resetEditor, savingDebtReceipt]);

  const reprintDebtReceipt = useCallback(
    async (payment) => {
      const customerId = debtDetail?.customer?.id || payment?.customerId;
      if (!customerId || !payment) return;
      try {
        const timelineRows = await loadDebtTimeline(customerId);
        await printDebtReceiptDocument({
          payment,
          customer: debtDetail?.customer || null,
          settings,
          timelineRow: findDebtReceiptTimelineRow(timelineRows, payment.id),
        });
      } catch (error) {
        message.error(
          `Không thể in lại phiếu thu nợ: ${error.message || 'Lỗi không xác định'}`
        );
      }
    },
    [debtDetail, loadDebtTimeline, settings]
  );

  const saveDebtReceipt = useCallback(
    async ({ shouldPrint = false } = {}) => {
      if (!editingDebtReceipt?.id || !debtDetail?.customer?.id) return;
      const amount = Number(editingDebtReceiptAmount || 0);
      if (amount <= 0) {
        message.error('Số tiền thu nợ phải lớn hơn 0.');
        return;
      }

      setSavingDebtReceipt(true);
      setDebtReceiptSubmitMode(shouldPrint ? 'print' : 'save');
      try {
        const payload = {
          ...editingDebtReceipt,
          date: editingDebtReceiptDate || editingDebtReceipt.date,
          amount,
          method: editingDebtReceiptMethod || 'cash',
          note: editingDebtReceiptNote || '',
        };
        const updated = await updatePaymentRecord(
          editingDebtReceipt.id,
          payload
        );
        const customerId = debtDetail.customer.id;
        const { nextDetail, nextTimelineRows } =
          await refreshDebtReceiptContext({
            customerId,
            loadDebtRows,
            loadDebtDetail,
            loadDebtTimeline,
          });
        const nextPayment =
          nextDetail?.debtReceipts?.find(
            (item) => item.id === editingDebtReceipt.id
          ) ||
          updated ||
          payload;
        const nextTimelineRow = findDebtReceiptTimelineRow(
          nextTimelineRows,
          editingDebtReceipt.id
        );

        if (shouldPrint) {
          try {
            await printDebtReceiptDocument({
              payment: nextPayment,
              customer: nextDetail?.customer || debtDetail.customer,
              settings,
              timelineRow: nextTimelineRow,
            });
          } catch (error) {
            message.warning(
              'Đã lưu phiếu thu nợ nhưng không thể in lại tự động.'
            );
            resetEditor();
            return;
          }
        }

        message.success(
          shouldPrint
            ? 'Đã cập nhật và in lại phiếu thu nợ.'
            : 'Đã cập nhật phiếu thu nợ.'
        );
        resetEditor();
      } catch (error) {
        message.error(
          `Không thể cập nhật phiếu thu nợ: ${error.message || 'Lỗi không xác định'}`
        );
      } finally {
        setSavingDebtReceipt(false);
        setDebtReceiptSubmitMode('');
      }
    },
    [
      debtDetail,
      editingDebtReceipt,
      editingDebtReceiptAmount,
      editingDebtReceiptDate,
      editingDebtReceiptMethod,
      editingDebtReceiptNote,
      loadDebtDetail,
      loadDebtRows,
      loadDebtTimeline,
      resetEditor,
      settings,
    ]
  );

  return {
    closeEditDebtReceipt,
    debtReceiptSubmitMode,
    editingDebtReceipt,
    editingDebtReceiptAmount,
    editingDebtReceiptDate,
    editingDebtReceiptMethod,
    editingDebtReceiptNote,
    editingDebtReceiptTimelineRow,
    openEditDebtReceipt,
    reprintDebtReceipt,
    resetEditor,
    saveDebtReceipt,
    savingDebtReceipt,
    setEditingDebtReceiptAmount,
    setEditingDebtReceiptDate,
    setEditingDebtReceiptMethod,
    setEditingDebtReceiptNote,
  };
};
