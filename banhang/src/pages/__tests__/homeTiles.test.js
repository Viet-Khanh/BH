import { expect, it } from 'vitest';
import { ALL_MODULES } from '../../editions/modules.js';
import { getVisibleTiles, HOME_TILES, splitIntoColumns } from '../homeTiles.js';

it('has one tile per known module', () => {
  expect(HOME_TILES.map((tile) => tile.module)).toEqual(ALL_MODULES);
});

it('keeps only tiles of enabled modules, in order', () => {
  const tiles = getVisibleTiles(['sales', 'system']);
  expect(tiles.map((tile) => tile.module)).toEqual(['system', 'sales']);
});

it('splits tiles into balanced columns', () => {
  const columns = splitIntoColumns(getVisibleTiles(ALL_MODULES), 2);
  expect(columns.map((column) => column.length)).toEqual([3, 3]);
  expect(splitIntoColumns(getVisibleTiles(['sales']), 2)).toHaveLength(1);
});
