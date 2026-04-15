import { useCallback, useMemo, useState } from 'react';
import { generateCode } from '../../../utils/codeGenerator.js';
import { buildPurchaseItems } from '../domain/purchasesDomain.js';

export const usePurchaseDraftState = ({ suppliers }) => {
  const [supplierId, setSupplierId] = useState('');
  const [date, setDate] = useState(new Date().toISOString());
  const [note, setNote] = useState('');
  const [items, setItems] = useState([]);
  const [draftCode, setDraftCode] = useState(generateCode('PO'));
  const [editing, setEditing] = useState(null);
  const [editScope, setEditScope] = useState('payment');

  const supplier = useMemo(
    () => suppliers.find((item) => item.id === supplierId),
    [supplierId, suppliers]
  );
  const isEdit = Boolean(editing);
  const isFullEdit = isEdit && editScope === 'full';
  const readOnlyEdit = isEdit && !isFullEdit;
  const totals = useMemo(
    () => items.reduce((sum, item) => sum + Number(item.lineTotal || 0), 0),
    [items]
  );
  const totalQty = useMemo(
    () => items.reduce((sum, item) => sum + Number(item.qty || 0), 0),
    [items]
  );

  const applyEditingValues = useCallback((purchase) => {
    setSupplierId(purchase?.supplierId || '');
    setDate(purchase?.date || new Date().toISOString());
    setNote(purchase?.note || '');
    setItems(buildPurchaseItems(purchase));
    setDraftCode(purchase?.code || generateCode('PO'));
  }, []);

  const resetDraft = useCallback(() => {
    setEditing(null);
    setEditScope('payment');
    setSupplierId('');
    setDate(new Date().toISOString());
    setNote('');
    setItems([]);
    setDraftCode(generateCode('PO'));
  }, []);

  return {
    supplierId,
    setSupplierId,
    date,
    setDate,
    note,
    setNote,
    items,
    setItems,
    draftCode,
    setDraftCode,
    editing,
    setEditing,
    editScope,
    setEditScope,
    supplier,
    isEdit,
    isFullEdit,
    readOnlyEdit,
    totals,
    totalQty,
    applyEditingValues,
    resetDraft,
  };
};
