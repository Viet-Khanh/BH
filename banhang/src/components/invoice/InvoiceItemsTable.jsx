import { useEffect, useRef, useState } from 'react';
import { Button, Input, InputNumber } from 'antd';
import { formatMoney } from '../../utils/moneyFormat.js';
import {
  formatNumberInput,
  parseNumberInput,
} from '../../utils/numberInput.js';

const getEditKey = (rowIndex, field) => `${rowIndex}:${field}`;

const isEmptyValue = (value) =>
  value === null || value === undefined || value === '';

const formatDisplayNumber = (value, { blankOnEmpty = false } = {}) => {
  if (blankOnEmpty && isEmptyValue(value)) return '';
  const number = Number(value || 0);
  if (!Number.isFinite(number)) return '';
  return new Intl.NumberFormat('vi-VN', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 3,
  }).format(number);
};

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
        onBlur={() => setEditingCell(null)}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === 'Escape') {
            setEditingCell(null);
          }
        }}
        {...inputProps}
      />
    );
  }

  return (
    <button
      type="button"
      className={`editable-cell ${className}${
        displayValue ? '' : ' is-empty'
      }`}
      onClick={() => setEditingCell(editKey)}
    >
      {displayValue || placeholder}
    </button>
  );
};

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
  const inputRef = useRef(null);
  const editKey = getEditKey(rowIndex, field);
  const isEditing = editingCell === editKey;
  const displayValue = value?.trim?.() || '';

  useEffect(() => {
    if (!isEditing) return;
    requestAnimationFrame(() => {
      inputRef.current?.focus?.({ cursor: 'all' });
      inputRef.current?.select?.();
    });
  }, [isEditing]);

  if (readOnly) return <span>{displayValue}</span>;

  if (isEditing) {
    return (
      <Input
        ref={inputRef}
        className="editable-input"
        value={value || ''}
        onChange={(event) => onUpdate(rowIndex, field, event.target.value)}
        onBlur={() => setEditingCell(null)}
        onPressEnter={() => setEditingCell(null)}
      />
    );
  }

  return (
    <button
      type="button"
      className={`editable-cell editable-cell-note${
        displayValue ? '' : ' is-empty'
      }`}
      onClick={() => setEditingCell(editKey)}
    >
      {displayValue || placeholder}
    </button>
  );
};

const InvoiceItemsTable = ({
  items,
  products,
  onUpdateItem,
  onRemoveItem,
  showDimensions = true,
  priceField = 'unitPrice',
  priceLabel = 'Đơn giá',
  qtyLabel = 'SL/m2',
  priceMin = 0,
  readOnly = false,
}) => {
  const [editingCell, setEditingCell] = useState(null);

  return (
    <div className="pos-table">
      <table>
        <thead>
          <tr>
            <th>STT</th>
            <th>Tên hàng</th>
            <th>ĐVT</th>
            {showDimensions && <th>Dài</th>}
            {showDimensions && <th>Rộng</th>}
            <th>{qtyLabel}</th>
            <th>{priceLabel}</th>
            <th>Thành tiền</th>
            <th>Ghi chú</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, index) => {
            const product = products.find((p) => p.id === item.productId);
            return (
              <tr key={`${item.productId}-${index}`}>
                <td className="pos-cell-center">{index + 1}</td>
                <td>
                  <div>
                    <strong>{product?.name || 'Sản phẩm'}</strong>
                  </div>
                  <div className="pos-product-code">{product?.code || ''}</div>
                </td>
                <td>{product?.unit || ''}</td>
                {showDimensions && (
                  <td className="pos-cell-number">
                    <EditableNumberCell
                      rowIndex={index}
                      field="length"
                      value={item.length}
                      displayValue={formatDisplayNumber(item.length, {
                        blankOnEmpty: true,
                      })}
                      placeholder="-"
                      className="numeric"
                      readOnly={readOnly}
                      editingCell={editingCell}
                      setEditingCell={setEditingCell}
                      onUpdate={onUpdateItem}
                      inputProps={{ min: 0 }}
                    />
                  </td>
                )}
                {showDimensions && (
                  <td className="pos-cell-number">
                    <EditableNumberCell
                      rowIndex={index}
                      field="width"
                      value={item.width}
                      displayValue={formatDisplayNumber(item.width, {
                        blankOnEmpty: true,
                      })}
                      placeholder="-"
                      className="numeric"
                      readOnly={readOnly}
                      editingCell={editingCell}
                      setEditingCell={setEditingCell}
                      onUpdate={onUpdateItem}
                      inputProps={{ min: 0 }}
                    />
                  </td>
                )}
                <td className="pos-cell-number">
                  <EditableNumberCell
                    rowIndex={index}
                    field="qty"
                    value={item.qty}
                    displayValue={formatDisplayNumber(item.qty)}
                    className="numeric"
                    readOnly={readOnly}
                    editingCell={editingCell}
                    setEditingCell={setEditingCell}
                    onUpdate={onUpdateItem}
                  />
                </td>
                <td className="pos-cell-money">
                  <EditableNumberCell
                    rowIndex={index}
                    field={priceField}
                    value={item[priceField]}
                    displayValue={formatMoney(item[priceField])}
                    className="numeric"
                    readOnly={readOnly}
                    editingCell={editingCell}
                    setEditingCell={setEditingCell}
                    onUpdate={onUpdateItem}
                    inputProps={{
                      min: priceMin,
                      formatter: formatNumberInput,
                      parser: parseNumberInput,
                    }}
                  />
                </td>
                <td className="pos-cell-money">{formatMoney(item.lineTotal)}</td>
                <td>
                  <EditableTextCell
                    rowIndex={index}
                    field="lineNote"
                    value={item.lineNote}
                    readOnly={readOnly}
                    editingCell={editingCell}
                    setEditingCell={setEditingCell}
                    onUpdate={onUpdateItem}
                  />
                </td>
                <td className="pos-cell-actions">
                  {!readOnly && (
                    <Button
                      danger
                      size="small"
                      onClick={() => onRemoveItem(index)}
                    >
                      Xóa
                    </Button>
                  )}
                </td>
              </tr>
            );
          })}
          {!items.length && (
            <tr>
              <td
                colSpan={showDimensions ? 10 : 8}
                style={{ textAlign: 'center' }}
              >
                Chưa có hàng hóa. Dùng ô tìm kiếm để thêm nhanh.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default InvoiceItemsTable;
