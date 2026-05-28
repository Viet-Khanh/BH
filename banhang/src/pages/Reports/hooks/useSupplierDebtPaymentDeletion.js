import { useCallback, useState } from 'react';
import { Modal, message } from 'antd';
import { deletePaymentRecord } from '../../../features/reports/api/reportsApi.js';

export const useSupplierDebtPaymentDeletion = ({
  debtDetail,
  loadSupplierDebtRows,
  loadSupplierDebtDetail,
}) => {
  const [deletingDebtPaymentId, setDeletingDebtPaymentId] = useState('');

  const deleteDebtPayment = useCallback(
    (payment) => {
      const supplierId = debtDetail?.supplier?.id || payment?.supplierId;
      if (!payment?.id || !supplierId) return;

      Modal.confirm({
        title: 'Hủy phiếu trả nợ?',
        content:
          'Phiếu trả nợ sẽ bị hủy và công nợ nhà cung cấp sẽ được tính lại như trước khi có phiếu này.',
        okText: 'Hủy phiếu',
        okButtonProps: { danger: true },
        cancelText: 'Không',
        onOk: async () => {
          setDeletingDebtPaymentId(payment.id);
          try {
            await deletePaymentRecord(payment.id);
            await Promise.all([
              loadSupplierDebtRows(),
              loadSupplierDebtDetail(supplierId),
            ]);
            message.success('Đã hủy phiếu trả nợ.');
          } catch (error) {
            message.error(
              `Không thể hủy phiếu trả nợ: ${error.message || 'Lỗi không xác định'}`
            );
            throw error;
          } finally {
            setDeletingDebtPaymentId('');
          }
        },
      });
    },
    [debtDetail, loadSupplierDebtDetail, loadSupplierDebtRows]
  );

  return {
    deleteDebtPayment,
    deletingDebtPaymentId,
  };
};
