import { InputNumber } from 'antd';
import { isEmptyValue } from '../../../utils/measureFormat.js';
import { useCellEditing } from './useCellEditing.js';

const EditableNumberCell = ({
  rowIndex,
  field,
  value,
  displayValue,
  className = '',
  placeholder = '',
  readOnly,
  editingCell,
  setEditingCell,
  onUpdate,
  inputProps = {},
}) => {
  const { inputRef, isEditing, startEditing, stopEditing } = useCellEditing({
    rowIndex,
    field,
    editingCell,
    setEditingCell,
  });

  if (readOnly) {
    return <span className={className}>{displayValue || placeholder}</span>;
  }

  if (isEditing) {
    return (
      <InputNumber
        ref={inputRef}
        className="editable-input"
        style={{ width: '100%' }}
        value={isEmptyValue(value) ? undefined : value}
        onChange={(nextValue) => onUpdate(rowIndex, field, nextValue)}
        onBlur={stopEditing}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === 'Escape') stopEditing();
        }}
        {...inputProps}
      />
    );
  }

  return (
    <button
      type="button"
      className={`editable-cell ${className}${displayValue ? '' : ' is-empty'}`}
      onClick={startEditing}
    >
      {displayValue || placeholder}
    </button>
  );
};

export default EditableNumberCell;
