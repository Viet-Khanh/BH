import { useCallback, useEffect, useRef, useState } from 'react';
import { message } from 'antd';
import { getInvoiceEditContext } from '../api/salesApi.js';

export const useSalesEditor = ({
  editId,
  mergeCatalogProducts,
  onInvoiceDebtLoaded,
}) => {
  const [editing, setEditing] = useState(null);
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
    if (!editId) return;

    let cancelled = false;

    const fetchInvoice = async () => {
      try {
        const data = await getInvoiceEditContext(editId);
        if (!data || cancelled) return;

        const nextInvoice = data.invoice || null;
        setEditing(nextInvoice);
        editingRef.current = nextInvoice;
        setInvoicePayments(Array.isArray(data.payments) ? data.payments : []);
        invoicePaymentsRef.current = Array.isArray(data.payments)
          ? data.payments
          : [];
        if (nextInvoice) {
          onInvoiceDebtLoaded?.(
            nextInvoice.customerDebt ?? nextInvoice.oldDebt ?? 0
          );
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
  }, [editId, mergeCatalogProducts, onInvoiceDebtLoaded]);

  const resetEditing = useCallback(() => {
    editingRef.current = null;
    invoicePaymentsRef.current = [];
    setEditing(null);
    setInvoicePayments([]);
  }, []);

  return {
    editing,
    setEditing,
    editingRef,
    invoicePayments,
    setInvoicePayments,
    invoicePaymentsRef,
    resetEditing,
  };
};
