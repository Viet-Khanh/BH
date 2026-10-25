import { Input } from 'antd';
import { useCellEditing } from './useCellEditing.js';

const EditableTextCell = ({
  rowIndex,
  field,
  value,
  placeholder = 'Ghi chú',
  readOnly,
  editingCell,
  setEditingCell,
  onUpdate,
}) => {
  const { inputRef, isEditing, startEditing, stopEditing } = useCellEditing({
    rowIndex,
    field,
    editingCell,
    setEditingCell,
  });
  const displayValue = value?.trim?.() || '';

  if (readOnly) return <span>{displayValue}</span>;

  if (isEditing) {
    return (
      <Input
        ref={inputRef}
        className="editable-input"
        value={value || ''}
        onChange={(event) => onUpdate(rowIndex, field, event.target.value)}
        onBlur={stopEditing}
        onPressEnter={stopEditing}
      />
    );
  }

  return (
    <button
      type="button"
      className={`editable-cell editable-cell-note${
        displayValue ? '' : ' is-empty'
      }`}
      onClick={startEditing}
    >
      {displayValue || placeholder}
    </button>
  );
};

export default EditableTextCell;
