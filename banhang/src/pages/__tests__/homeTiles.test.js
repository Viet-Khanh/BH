import { expect, it } from 'vitest';
import { getVisibleTiles, HOME_TILES, splitIntoColumns } from '../homeTiles.js';

const keys = (tiles) => tiles.map((tile) => tile.module);

it('shows every core tile by default', () => {
  expect(keys(getVisibleTiles())).toEqual(keys(HOME_TILES));
});

it('appends module tiles and removes hidden modules', () => {
  const moduleTiles = [{ module: 'expiry', label: 'HẠN DÙNG', to: '/expiry' }];
  const tiles = getVisibleTiles(moduleTiles, ['cashbook']);
  expect(keys(tiles)).toEqual([
    'system',
    'catalog',
    'sales',
    'purchases',
    'reports',
    'expiry',
  ]);
});

it('splits tiles into balanced columns', () => {
  const columns = splitIntoColumns(getVisibleTiles(), 2);
  expect(columns.map((column) => column.length)).toEqual([3, 3]);
  expect(splitIntoColumns(getVisibleTiles([], ['catalog']), 2)).toHaveLength(2);
});
