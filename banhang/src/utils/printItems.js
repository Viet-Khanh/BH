import { hasFeature } from '../editions/editionRuntime.js';
import { escapeHtml } from './htmlEscape.js';
import { getMeasuredQty, hasDimensions } from './lineMeasure.js';
import { formatMeasure } from './measureFormat.js';
import { formatRoundedMoney } from './moneyFormat.js';

const STYLES = {
  index: 'width:30px;text-align:center;',
  name: 'width:38%;text-align:left;overflow-wrap:anywhere;',
  unit: 'width:44px;text-align:center;',
  qty: 'width:56px;text-align:center;',
  dimension: 'width:44px;text-align:center;',
  areaQty: 'width:66px;text-align:right;',
  money: 'width:92px;text-align:right;',
  total: 'width:100px;text-align:right;',
};

const measure = (value) => formatMeasure(value, { blankOnZero: true });

const onlyMeasured = (pick) => (row) =>
  row.measured ? measure(pick(row.item)) : '';

const DIMENSION_COLUMNS = [
  {
    title: 'D',
    style: STYLES.dimension,
    cell: onlyMeasured((item) => item.length),
  },
  {
    title: 'R',
    style: STYLES.dimension,
    cell: onlyMeasured((item) => item.width),
  },
  { title: 'M2', style: STYLES.areaQty, cell: onlyMeasured(getMeasuredQty) },
];

// Columns of the {{items}} table; dimension columns follow the edition flag.
export const buildPrintItemColumns = ({ dimensions }) => [
  { title: 'TT', style: STYLES.index, cell: (row) => String(row.index + 1) },
  { title: 'Tên hàng', style: STYLES.name, cell: (row) => row.nameHtml },
  { title: 'ĐVT', style: STYLES.unit, cell: (row) => escapeHtml(row.unit) },
  { title: 'SL', style: STYLES.qty, cell: (row) => measure(row.item.qty) },
  ...(dimensions ? DIMENSION_COLUMNS : []),
  {
    title: 'Đơn giá',
    style: STYLES.money,
    cell: (row) => formatRoundedMoney(row.item.unitPrice),
  },
  {
    title: 'Thành tiền',
    style: STYLES.total,
    cell: (row) => formatRoundedMoney(row.item.lineTotal),
  },
];

const resolveName = (item, product) =>
  product ? product.name : item?.name || 'Sản phẩm';

const productKey = (item, product) =>
  item?.productId || (product || item?.name ? resolveName(item, product) : '');

const buildNameHtml = (name, note, hideName) => {
  const nameHtml = hideName
    ? ''
    : `<div class="item-name" style="font-weight:500;color:#444;">${escapeHtml(name)}</div>`;
  const noteHtml = note
    ? `<div class="item-note">${escapeHtml(note)}</div>`
    : '';
  return `${nameHtml}${noteHtml}`;
};

// Consecutive lines of the same product print the name once.
export const buildPrintRows = (items = [], products = []) => {
  const findProduct = (item) => products.find((p) => p.id === item?.productId);
  return items.map((item, index) => {
    const product = findProduct(item);
    const previous = items[index - 1];
    const key = productKey(item, product);
    const sameAsPrevious = Boolean(
      previous && key && key === productKey(previous, findProduct(previous))
    );
    return {
      index,
      item,
      unit: product?.unit || '',
      measured: hasDimensions(item),
      nameHtml: buildNameHtml(
        resolveName(item, product),
        item.lineNote,
        sameAsPrevious
      ),
    };
  });
};

export const buildItemsHtml = (
  items = [],
  products = [],
  { dimensions = hasFeature('dimensions') } = {}
) => {
  const columns = buildPrintItemColumns({ dimensions });
  const header = columns
    .map((column) => `<th style="${column.style}">${column.title}</th>`)
    .join('');
  const body = buildPrintRows(items, products)
    .map((row) => {
      const cells = columns
        .map((column) => `<td style="${column.style}">${column.cell(row)}</td>`)
        .join('');
      return `<tr>${cells}</tr>`;
    })
    .join('');
  return `<table class="items"><thead><tr>${header}</tr></thead><tbody>${body}</tbody></table>`;
};
