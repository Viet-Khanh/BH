import { useCallback, useEffect, useRef, useState } from 'react';
import { message } from 'antd';
import { getInvoiceEditContext } from '../api/salesApi.js';
import { buildCopiedInvoiceDraft } from '../domain/salesDomain.js';

export const useSalesEditor = ({ editId, copyId, mergeCatalogProducts }) => {
  const [editing, setEditing] = useState(null);
  const [draftInvoice, setDraftInvoice] = useState(null);
  const [invoicePayments, setInvoicePayments] = useState([]);
  const editingRef = useRef(null);
  const invoicePaymentsRef = useRef([]);

  useEffect(() => {
    editingRef.current = editing;
  }, [editing]);

  useEffect(() => {
    invoicePaymentsRef.current = invoicePayments;
  }, [invoicePayments]);

  useEffect(() => {
    const sourceId = editId || copyId;
    if (!sourceId) return;

    let cancelled = false;

    const fetchInvoice = async () => {
      try {
        const data = await getInvoiceEditContext(sourceId);
        if (!data || cancelled) return;

        if (copyId && !editId) {
          const copiedDraft = buildCopiedInvoiceDraft(data.invoice);
          if (!copiedDraft) {
            throw new Error('Invoice not found');
          }
          setDraftInvoice(copiedDraft);
          setEditing(null);
          editingRef.current = null;
          setInvoicePayments([]);
          invoicePaymentsRef.current = [];
          message.success('Đã sao chép hóa đơn sang phiếu mới.');
        } else {
          setDraftInvoice(null);
          setEditing(data.invoice || null);
          editingRef.current = data.invoice || null;
          setInvoicePayments(
            Array.isArray(data.payments) ? data.payments : []
          );
          invoicePaymentsRef.current = Array.isArray(data.payments)
            ? data.payments
            : [];
        }
        mergeCatalogProducts(Array.isArray(data.products) ? data.products : []);
      } catch (error) {
        if (!cancelled) {
          message.error('Không thể tải hóa đơn.');
        }
      }
    };

    fetchInvoice();

    return () => {
      cancelled = true;
    };
  }, [copyId, editId, mergeCatalogProducts]);

  const resetEditing = useCallback(() => {
    editingRef.current = null;
    invoicePaymentsRef.current = [];
    setEditing(null);
    setDraftInvoice(null);
    setInvoicePayments([]);
  }, []);

  return {
    editing,
    draftInvoice,
    setEditing,
    editingRef,
    invoicePayments,
    setInvoicePayments,
    invoicePaymentsRef,
    resetEditing,
  };
};
