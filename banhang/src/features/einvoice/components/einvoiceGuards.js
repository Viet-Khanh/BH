import { Modal } from 'antd';
import dayjs from 'dayjs';

const exportedOn = (invoice) =>
  invoice?.einvoice?.exportedAt
    ? dayjs(invoice.einvoice.exportedAt).format('DD/MM/YYYY')
    : null;

const ADJUST_HINT =
  'bạn cần lập hoá đơn điều chỉnh/thay thế (hoặc huỷ) trên trang nhà cung cấp hoá đơn điện tử.';

// Text appended to delete confirmations of exported invoices ('' otherwise).
export const einvoiceDeleteNotice = (invoice) => {
  const date = exportedOn(invoice);
  return date
    ? `Hoá đơn này đã xuất HĐĐT ngày ${date}: sau khi xoá, ${ADJUST_HINT}`
    : '';
};

// Resolves true when the edit may proceed (not exported, or the user confirmed).
export const confirmEinvoiceEdit = (invoice) => {
  const date = exportedOn(invoice);
  if (!date) return Promise.resolve(true);
  return new Promise((resolve) => {
    Modal.confirm({
      title: 'Hoá đơn đã xuất hoá đơn điện tử',
      content: `Hoá đơn này đã xuất HĐĐT ngày ${date}. Sau khi sửa, ${ADJUST_HINT}`,
      okText: 'Vẫn lưu',
      cancelText: 'Huỷ',
      onOk: () => resolve(true),
      onCancel: () => resolve(false),
    });
  });
};
