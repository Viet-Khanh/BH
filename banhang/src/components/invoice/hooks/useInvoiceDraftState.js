import { useEffect, useMemo, useState } from 'react';
import { generateCode } from '../../../utils/codeGenerator.js';
import { buildInvoiceItems } from '../invoiceTicketHandlers.js';

export const buildDefaultCustomerId = (customers) =>
  customers.find(
    (item) =>
      !item.isDeleted && (item.name === 'Khách lẻ' || item.name === 'Khach le')
  )?.id || '';

export const useInvoiceDraftState = ({
  invoice,
  customers = [],
  onCustomerChange,
}) => {
  const defaultCustomerId = useMemo(
    () => buildDefaultCustomerId(customers),
    [customers]
  );
  const [customerId, setCustomerId] = useState(
    invoice?.customerId || defaultCustomerId
  );
  const [date, setDate] = useState(invoice?.date || new Date().toISOString());
  const [items, setItems] = useState([]);
  const [note, setNote] = useState(invoice?.note || '');
  const [printNote, setPrintNote] = useState('');
  const [draftCode, setDraftCode] = useState(
    invoice?.code || generateCode('INV')
  );

  useEffect(() => {
    if (invoice) {
      setCustomerId(invoice.customerId || defaultCustomerId);
      setDate(invoice.date || new Date().toISOString());
      setNote(invoice.note || '');
      setPrintNote('');
      setDraftCode(invoice.code || generateCode('INV'));
      setItems(buildInvoiceItems(invoice));
      return;
    }

    setCustomerId(defaultCustomerId);
    setDate(new Date().toISOString());
    setNote('');
    setPrintNote('');
    setDraftCode(generateCode('INV'));
    setItems([]);
  }, [defaultCustomerId, invoice]);

  useEffect(() => {
    if (!onCustomerChange || !customerId) return;
    onCustomerChange(customerId, invoice?.id || null, date);
  }, [customerId, date, invoice?.id, onCustomerChange]);

  return {
    defaultCustomerId,
    customerId,
    setCustomerId,
    date,
    setDate,
    items,
    setItems,
    note,
    setNote,
    printNote,
    setPrintNote,
    draftCode,
    setDraftCode,
  };
};
