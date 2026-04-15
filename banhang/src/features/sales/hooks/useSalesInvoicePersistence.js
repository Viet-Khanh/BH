import { useCallback } from 'react';
import { message } from 'antd';
import { v4 as uuid } from 'uuid';
import { createInvoice, updateInvoice } from '../api/salesApi.js';
import {
  buildCreatedInvoicePayload,
  buildUpdatedInvoicePayload,
  sumPayments,
} from '../domain/salesDomain.js';

export const useSalesInvoicePersistence = ({
  editing,
  setEditing,
  editingRef,
  invoicePayments,
  setInvoicePayments,
  loadInvoices,
}) => {
  const saveInvoice = useCallback(
    async (data) => {
      if (editing) {
        const nextInvoice = buildUpdatedInvoicePayload({
          editing,
          data,
          paid: sumPayments(invoicePayments),
        });
        const saved = await updateInvoice(editing.id, nextInvoice);
        const next = saved || nextInvoice;
        setEditing(next);
        editingRef.current = next;
        await loadInvoices();
        message.success('Đã cập nhật hóa đơn.');
        return next;
      }

      const newInvoice = buildCreatedInvoicePayload({ data, id: uuid() });
      const created = await createInvoice(newInvoice);
      const next = created || newInvoice;
      setEditing(next);
      editingRef.current = next;
      setInvoicePayments([]);
      await loadInvoices();
      message.success('Đã tạo hóa đơn.');
      return next;
    },
    [
      editing,
      editingRef,
      invoicePayments,
      loadInvoices,
      setEditing,
      setInvoicePayments,
    ]
  );

  const newInvoice = useCallback(() => {
    editingRef.current = null;
    setEditing(null);
    setInvoicePayments([]);
  }, [editingRef, setEditing, setInvoicePayments]);

  return {
    saveInvoice,
    newInvoice,
  };
};
