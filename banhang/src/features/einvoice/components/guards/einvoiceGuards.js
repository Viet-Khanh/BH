import { Modal } from 'antd';
import dayjs from 'dayjs';
import { useSettingsStore } from '../../../../store/settingsStore.js';
import { hasContentChange } from '../../domain/contentChange.js';

const exportedOn = (invoice) =>
  invoice?.einvoice?.exportedAt
    ? dayjs(invoice.einvoice.exportedAt).format('DD/MM/YYYY')
    : null;

const currentSettings = () => useSettingsStore.getState().settings || {};

const ADJUST_HINT =
  'bạn cần lập hoá đơn điều chỉnh/thay thế (hoặc huỷ) trên trang nhà cung cấp hoá đơn điện tử.';
const UNLOCK_HINT =
  'Cửa hàng đang bật khoá hoá đơn đã xuất. Vào Hoá đơn điện tử → "Bỏ đánh dấu" nếu thật sự cần sửa.';

// Text appended to delete confirmations of exported invoices ('' otherwise).
export const einvoiceDeleteNotice = (invoice, settings = currentSettings()) => {
  const date = exportedOn(invoice);
  if (!date) return '';
  if (settings.einvoiceLockExported)
    return `Hoá đơn này đã xuất HĐĐT ngày ${date}. ${UNLOCK_HINT}`;
  return `Hoá đơn này đã xuất HĐĐT ngày ${date}: sau khi xoá, ${ADJUST_HINT}`;
};

// Resolves true when saving `next` over `invoice` may proceed: not exported,
// no content change (e.g. only a payment), or the user confirmed. With the lock
// on, content changes are refused (the backend refuses them too).
export const confirmEinvoiceEdit = (
  invoice,
  next,
  settings = currentSettings()
) => {
  const date = exportedOn(invoice);
  if (!date || !hasContentChange(invoice, next)) return Promise.resolve(true);
  if (settings.einvoiceLockExported) {
    return new Promise((resolve) => {
      Modal.info({
        title: 'Hoá đơn đã xuất hoá đơn điện tử',
        content: `Hoá đơn này đã xuất HĐĐT ngày ${date}. ${UNLOCK_HINT}`,
        okText: 'Đã hiểu',
        onOk: () => resolve(false),
      });
    });
  }
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
