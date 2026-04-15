import { useCallback, useEffect, useRef, useState } from 'react';
import { message } from 'antd';
import { getInvoiceEditContext } from '../api/salesApi.js';

export const useSalesEditor = ({ editId, mergeCatalogProducts }) => {
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

        setEditing(data.invoice || null);
        editingRef.current = data.invoice || null;
        setInvoicePayments(Array.isArray(data.payments) ? data.payments : []);
        invoicePaymentsRef.current = Array.isArray(data.payments)
          ? data.payments
          : [];
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
  }, [editId, mergeCatalogProducts]);

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
