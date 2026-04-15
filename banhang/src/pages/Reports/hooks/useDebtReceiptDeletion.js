import { useCallback, useState } from 'react';
import { Modal, message } from 'antd';
import { deletePaymentRecord } from '../../../features/reports/api/reportsApi.js';

export const useDebtReceiptDeletion = ({
  debtDetail,
  loadDebtRows,
  loadDebtDetail,
  loadDebtTimeline,
}) => {
  const [deletingDebtReceiptId, setDeletingDebtReceiptId] = useState('');

  const deleteDebtReceipt = useCallback(
    (payment) => {
      const customerId = debtDetail?.customer?.id || payment?.customerId;
      if (!payment?.id || !customerId) return;

      Modal.confirm({
        title: 'Hủy phiếu thu nợ?',
        content:
          'Phiếu thu nợ sẽ bị hủy và công nợ sẽ được tính lại như trước khi có phiếu này.',
        okText: 'Hủy phiếu',
        okButtonProps: { danger: true },
        cancelText: 'Không',
        onOk: async () => {
          setDeletingDebtReceiptId(payment.id);
          try {
            await deletePaymentRecord(payment.id);
            await Promise.all([
              loadDebtRows(),
              loadDebtDetail(customerId),
              loadDebtTimeline(customerId),
            ]);
            message.success('Đã hủy phiếu thu nợ.');
          } catch (error) {
            message.error(
              `Không thể hủy phiếu thu nợ: ${error.message || 'Lỗi không xác định'}`
            );
            throw error;
          } finally {
            setDeletingDebtReceiptId('');
          }
        },
      });
    },
    [debtDetail, loadDebtDetail, loadDebtRows, loadDebtTimeline]
  );

  return {
    deleteDebtReceipt,
    deletingDebtReceiptId,
  };
};
