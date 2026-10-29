import { Button } from 'antd';
import { Fragment } from 'react';
import { getMeasuredQty } from '../../../utils/lineMeasure.js';
import { formatMeasure } from '../../../utils/measureFormat.js';
import { formatMoney } from '../../../utils/moneyFormat.js';
import {
  formatNumberInput,
  parseNumberInput,
} from '../../../utils/numberInput.js';
import EditableNumberCell from './EditableNumberCell.jsx';
import EditableTextCell from './EditableTextCell.jsx';
import UnitCell from './UnitCell.jsx';

const numberCell = (row, field, cellProps) => (
  <td className="pos-cell-number">
    <EditableNumberCell
      rowIndex={row.index}
      field={field}
      value={row.item[field]}
      className="numeric"
      {...row.editing}
      {...cellProps}
    />
  </td>
);

const dimensionCell = (field) => (row) =>
  numberCell(row, field, {
    displayValue: formatMeasure(row.item[field], { blankOnEmpty: true }),
    placeholder: '-',
    inputProps: { min: 0 },
  });

const priceCell = (row) => (
  <td className="pos-cell-money">
    <EditableNumberCell
      rowIndex={row.index}
      field={row.priceField}
      value={row.item[row.priceField]}
      displayValue={formatMoney(row.item[row.priceField])}
      className="numeric"
      {...row.editing}
      inputProps={{
        min: row.priceMin,
        formatter: formatNumberInput,
        parser: parseNumberInput,
      }}
    />
  </td>
);

// One renderer per column key from itemColumns.js.
const CELL_RENDERERS = {
  index: (row) => <td className="pos-cell-center">{row.index + 1}</td>,
  name: ({ product }) => (
    <td>
      <div>
        <strong>{product?.name || 'Sản phẩm'}</strong>
      </div>
      <div className="pos-product-code">{product?.code || ''}</div>
    </td>
  ),
  unit: (row) => (
    <UnitCell
      item={row.item}
      product={row.product}
      index={row.index}
      onChangeUnit={row.onChangeUnit}
      readOnly={row.editing.readOnly}
    />
  ),
  length: dimensionCell('length'),
  width: dimensionCell('width'),
  qty: (row) =>
    numberCell(row, 'qty', { displayValue: formatMeasure(row.item.qty) }),
  measuredQty: ({ item }) => (
    <td className="pos-cell-number">{formatMeasure(getMeasuredQty(item))}</td>
  ),
  price: priceCell,
  lineTotal: ({ item }) => (
    <td className="pos-cell-money">{formatMoney(item.lineTotal)}</td>
  ),
  note: (row) => (
    <td>
      <EditableTextCell
        rowIndex={row.index}
        field="lineNote"
        value={row.item.lineNote}
        {...row.editing}
      />
    </td>
  ),
  actions: (row) => (
    <td className="pos-cell-actions">
      {!row.editing.readOnly && (
        <Button danger size="small" onClick={row.onRemove}>
          Xóa
        </Button>
      )}
    </td>
  ),
};

const InvoiceItemRow = ({ columns, ...row }) => (
  <tr>
    {columns.map((column) => (
      <Fragment key={column.key}>{CELL_RENDERERS[column.key](row)}</Fragment>
    ))}
  </tr>
);

export default InvoiceItemRow;
