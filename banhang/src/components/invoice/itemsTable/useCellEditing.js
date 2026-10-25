import { useEffect, useRef } from 'react';

const getEditKey = (rowIndex, field) => `${rowIndex}:${field}`;

// Tracks whether a cell is in edit mode and focuses/selects its input when it is.
export const useCellEditing = ({
  rowIndex,
  field,
  editingCell,
  setEditingCell,
}) => {
  const inputRef = useRef(null);
  const editKey = getEditKey(rowIndex, field);
  const isEditing = editingCell === editKey;

  useEffect(() => {
    if (!isEditing) return;
    requestAnimationFrame(() => {
      inputRef.current?.focus?.({ cursor: 'all' });
      inputRef.current?.select?.();
    });
  }, [isEditing]);

  return {
    inputRef,
    isEditing,
    startEditing: () => setEditingCell(editKey),
    stopEditing: () => setEditingCell(null),
  };
};
