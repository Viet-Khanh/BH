import { getAvailableEditions } from '../../platform/moduleRuntime.js';
import fashion from './fashion/index.js';
import minimart from './minimart/index.js';
import nhomkinh from './nhomkinh/index.js';
import pharmacy from './pharmacy/index.js';
import vlxd from './vlxd/index.js';

const SEED_DATA = { nhomkinh, vlxd, minimart, fashion, pharmacy };

// Edition config (src/editions, via the module runtime) + sample data (this folder),
// in catalog order (= picker order).
// See ../README.md "Add an edition".
export const DEMO_EDITIONS = getAvailableEditions().map((edition) => ({
  id: edition.id,
  ...edition.config,
  ...SEED_DATA[edition.id],
}));

export const getDemoEdition = (editionId) =>
  DEMO_EDITIONS.find((edition) => edition.id === editionId) || null;
