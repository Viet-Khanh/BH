import { expect, it } from 'vitest';
import { buildItemColumns } from '../itemColumns.js';

const labels = {
  qtyLabel: 'SL',
  totalQtyLabel: 'Tổng Sl/m2',
  priceLabel: 'Đơn giá',
};
const keys = (columns) => columns.map((column) => column.key);

it('includes dimension and measured columns when enabled', () => {
  const columns = buildItemColumns({
    ...labels,
    showDimensions: true,
    showTotalQty: true,
  });
  expect(keys(columns)).toEqual([
    'index',
    'name',
    'unit',
    'length',
    'width',
    'qty',
    'measuredQty',
    'price',
    'lineTotal',
    'note',
    'actions',
  ]);
  expect(columns.find((column) => column.key === 'measuredQty').title).toBe(
    'Tổng Sl/m2'
  );
});

it('drops them when dimensions are off', () => {
  const columns = buildItemColumns({
    ...labels,
    showDimensions: false,
    showTotalQty: true,
  });
  expect(keys(columns)).toEqual([
    'index',
    'name',
    'unit',
    'qty',
    'price',
    'lineTotal',
    'note',
    'actions',
  ]);
});
