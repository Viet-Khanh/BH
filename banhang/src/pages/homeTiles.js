// Home screen tiles. `action` names a handler provided by Home.jsx; `to` is a route.
export const HOME_TILES = [
  {
    module: 'system',
    label: 'HỆ THỐNG',
    tone: 'linear-gradient(135deg, #0f6f75, #0d8f8a)',
    action: 'openSystem',
  },
  {
    module: 'catalog',
    label: 'DANH MỤC',
    tone: 'linear-gradient(135deg, #118d6c, #0dbf6a)',
    to: '/catalog',
  },
  {
    module: 'sales',
    label: 'BÁN HÀNG',
    tone: 'linear-gradient(135deg, #0f8f8a, #14b36a)',
    to: '/sales',
  },
  {
    module: 'purchases',
    label: 'NHẬP HÀNG',
    tone: 'linear-gradient(135deg, #12a36e, #0bc26b)',
    to: '/purchases',
  },
  {
    module: 'cashbook',
    label: 'THU CHI',
    tone: 'linear-gradient(135deg, #0f7f86, #0ea06d)',
    to: '/cashbook',
  },
  {
    module: 'reports',
    label: 'BÁO CÁO',
    tone: 'linear-gradient(135deg, #0c7c78, #0f9e8b)',
    action: 'openReports',
  },
];

// Core tiles first, then tiles added by edition/customer modules; hidden modules removed.
export const getVisibleTiles = (moduleTiles = [], hiddenModules = []) =>
  [...HOME_TILES, ...moduleTiles].filter(
    (tile) => !hiddenModules.includes(tile.module)
  );

export const splitIntoColumns = (tiles, columnCount) => {
  const size = Math.ceil(tiles.length / columnCount);
  return Array.from({ length: columnCount }, (_, index) =>
    tiles.slice(index * size, (index + 1) * size)
  ).filter((column) => column.length);
};
