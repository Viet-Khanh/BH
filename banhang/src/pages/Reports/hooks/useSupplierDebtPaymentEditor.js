import { useCallback, useState } from 'react';
import { message } from 'antd';
import { updatePaymentRecord } from '../../../features/reports/api/reportsApi.js';
import {
  findSupplierDebtPaymentRow,
  printSupplierDebtPaymentDocument,
} from '../reportSupplierDebtPaymentActions.js';

export const useSupplierDebtPaymentEditor = ({
  debtDetail,
  loadSupplierDebtRows,
  loadSupplierDebtDetail,
  settings,
}) => {
  const [editingDebtPayment, setEditingDebtPayment] = useState(null);
  const [editingDebtPaymentTimelineRow, setEditingDebtPaymentTimelineRow] =
    useState(null);
  const [editingDebtPaymentDate, setEditingDebtPaymentDate] = useState('');
  const [editingDebtPaymentAmount, setEditingDebtPaymentAmount] = useState(0);
  const [editingDebtPaymentMethod, setEditingDebtPaymentMethod] =
    useState('cash');
  const [editingDebtPaymentNote, setEditingDebtPaymentNote] = useState('');
  const [savingDebtPayment, setSavingDebtPayment] = useState(false);
  const [debtPaymentSubmitMode, setDebtPaymentSubmitMode] = useState('');

  const resetEditor = useCallback(() => {
    setEditingDebtPayment(null);
    setEditingDebtPaymentTimelineRow(null);
    setEditingDebtPaymentDate('');
    setEditingDebtPaymentAmount(0);
    setEditingDebtPaymentMethod('cash');
    setEditingDebtPaymentNote('');
    setDebtPaymentSubmitMode('');
  }, []);

  const openEditDebtPayment = useCallback(
    (payment) => {
      setEditingDebtPayment(payment);
      setEditingDebtPaymentTimelineRow(
        findSupplierDebtPaymentRow(debtDetail, payment.id) || payment
      );
      setEditingDebtPaymentDate(payment.date || new Date().toISOString());
      setEditingDebtPaymentAmount(Number(payment.amount || 0));
      setEditingDebtPaymentMethod(payment.method || 'cash');
      setEditingDebtPaymentNote(payment.note || '');
    },
    [debtDetail]
  );

  const closeEditDebtPayment = useCallback(() => {
    if (savingDebtPayment) return;
    resetEditor();
  }, [resetEditor, savingDebtPayment]);

  const reprintDebtPayment = useCallback(
    async (payment) => {
      const supplierId = debtDetail?.supplier?.id || payment?.supplierId;
      if (!supplierId || !payment) return;
      try {
        const nextDetail = await loadSupplierDebtDetail(supplierId);
        const nextPayment =
          findSupplierDebtPaymentRow(nextDetail, payment.id) || payment;
        await printSupplierDebtPaymentDocument({
          payment: nextPayment,
          supplier: nextDetail?.supplier || debtDetail?.supplier || null,
          settings,
          timelineRow: nextPayment,
          copies: 1,
        });
      } catch (error) {
        message.error(
          `Không thể in lại phiếu trả nợ: ${error.message || 'Lỗi không xác định'}`
        );
      }
    },
    [debtDetail, loadSupplierDebtDetail, settings]
  );

  const saveDebtPayment = useCallback(
    async ({ shouldPrint = false } = {}) => {
      if (!editingDebtPayment?.id || !debtDetail?.supplier?.id) return;
      const amount = Number(editingDebtPaymentAmount || 0);
      if (amount <= 0) {
        message.error('Số tiền trả nợ phải lớn hơn 0.');
        return;
      }

      setSavingDebtPayment(true);
      setDebtPaymentSubmitMode(shouldPrint ? 'print' : 'save');
      try {
        const payload = {
          id: editingDebtPayment.id,
          code: editingDebtPayment.code || '',
          date: editingDebtPaymentDate || editingDebtPayment.date,
          amount,
          method: editingDebtPaymentMethod || 'cash',
          note: editingDebtPaymentNote || '',
        };
        const updated = await updatePaymentRecord(
          editingDebtPayment.id,
          payload
        );
        const supplierId = debtDetail.supplier.id;
        const [, nextDetail] = await Promise.all([
          loadSupplierDebtRows(),
          loadSupplierDebtDetail(supplierId),
        ]);
        const nextPayment =
          findSupplierDebtPaymentRow(nextDetail, editingDebtPayment.id) ||
          updated ||
          payload;

        if (shouldPrint) {
          try {
            await printSupplierDebtPaymentDocument({
              payment: nextPayment,
              supplier: nextDetail?.supplier || debtDetail.supplier,
              settings,
              timelineRow: nextPayment,
              copies: 1,
            });
          } catch (error) {
            message.warning(
              'Đã lưu phiếu trả nợ nhưng không thể in lại tự động.'
            );
            resetEditor();
            return;
          }
        }

        message.success(
          shouldPrint
            ? 'Đã cập nhật và in lại phiếu trả nợ.'
            : 'Đã cập nhật phiếu trả nợ.'
        );
        resetEditor();
      } catch (error) {
        message.error(
          `Không thể cập nhật phiếu trả nợ: ${error.message || 'Lỗi không xác định'}`
        );
      } finally {
        setSavingDebtPayment(false);
        setDebtPaymentSubmitMode('');
      }
    },
    [
      debtDetail,
      editingDebtPayment,
      editingDebtPaymentAmount,
      editingDebtPaymentDate,
      editingDebtPaymentMethod,
      editingDebtPaymentNote,
      loadSupplierDebtDetail,
      loadSupplierDebtRows,
      resetEditor,
      settings,
    ]
  );

  return {
    closeEditDebtPayment,
    debtPaymentSubmitMode,
    editingDebtPayment,
    editingDebtPaymentAmount,
    editingDebtPaymentDate,
    editingDebtPaymentMethod,
    editingDebtPaymentNote,
    editingDebtPaymentTimelineRow,
    openEditDebtPayment,
    reprintDebtPayment,
    resetEditor,
    saveDebtPayment,
    savingDebtPayment,
    setEditingDebtPaymentAmount,
    setEditingDebtPaymentDate,
    setEditingDebtPaymentMethod,
    setEditingDebtPaymentNote,
  };
};
