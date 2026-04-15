import { Modal } from 'antd';
import { generateCode } from '../../utils/codeGenerator.js';

export const buildInvoiceItems = (invoice) =>
  (invoice?.items || []).map((item) => ({
    ...item,
    lineNote: item.lineNote || '',
    length: item.length ?? null,
    width: item.width ?? null,
  }));

export const createCancelTicketHandler =
  ({ invoice, setItems, setNote, setPrintNote, setDate, setDraftCode }) =>
  () => {
    Modal.confirm({
      title: 'Hủy phiếu hiện tại?',
      content: 'Dữ liệu chưa lưu sẽ bị xóa.',
      okText: 'Hủy phiếu',
      cancelText: 'Giữ lại',
      onOk: () => {
        if (invoice) {
          setItems(buildInvoiceItems(invoice));
          setNote(invoice.note || '');
          setPrintNote('');
          setDate(invoice.date || new Date().toISOString());
          return;
        }
        setItems([]);
        setNote('');
        setPrintNote('');
        setDate(new Date().toISOString());
        setDraftCode(generateCode('INV'));
      },
    });
  };

export const createNewTicketHandler =
  ({
    onNewInvoice,
    setItems,
    setNote,
    setPrintNote,
    setDate,
    setDraftCode,
    setCustomerId,
    defaultCustomerId,
    setSearchKeyword,
    setPendingProduct,
    setPendingQty,
    setPendingPrice,
    setPendingLength,
    setPendingWidth,
  }) =>
  () => {
    if (onNewInvoice) {
      onNewInvoice();
    }
    setItems([]);
    setNote('');
    setPrintNote('');
    setDate(new Date().toISOString());
    setDraftCode(generateCode('INV'));
    setCustomerId(defaultCustomerId);
    setSearchKeyword('');
    setPendingProduct(null);
    setPendingQty(1);
    setPendingPrice(0);
    setPendingLength(null);
    setPendingWidth(null);
  };
