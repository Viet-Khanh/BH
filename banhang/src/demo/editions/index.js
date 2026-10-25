import { EDITION_IDS, getEditionConfig } from '../../editions/index.js';
import fashion from './fashion/index.js';
import minimart from './minimart/index.js';
import nhomkinh from './nhomkinh/index.js';
import pharmacy from './pharmacy/index.js';
import vlxd from './vlxd/index.js';

const SEED_DATA = { nhomkinh, vlxd, minimart, fashion, pharmacy };

// Display config (src/editions) + sample data (this folder), in picker order.
// See ../README.md "Add an edition".
export const DEMO_EDITIONS = EDITION_IDS.map((id) => ({
  ...getEditionConfig(id),
  ...SEED_DATA[id],
}));

export const getDemoEdition = (editionId) =>
  DEMO_EDITIONS.find((edition) => edition.id === editionId) || null;
