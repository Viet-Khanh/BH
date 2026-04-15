import {
  createCancelTicketHandler,
  createNewTicketHandler,
} from '../invoiceTicketHandlers.js';

export const useInvoiceTicketActions = ({
  invoice,
  onNewInvoice,
  defaultCustomerId,
  setItems,
  setNote,
  setPrintNote,
  setDate,
  setDraftCode,
  setCustomerId,
  setSearchKeyword,
  setPendingProduct,
  setPendingQty,
  setPendingPrice,
  setPendingLength,
  setPendingWidth,
}) => {
  const handleCancelTicket = createCancelTicketHandler({
    invoice,
    setItems,
    setNote,
    setPrintNote,
    setDate,
    setDraftCode,
  });

  const handleNewTicket = createNewTicketHandler({
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
  });

  return {
    handleCancelTicket,
    handleNewTicket,
  };
};
