import { DEFAULT_EDITION_ID, EDITION_IDS } from './editionIds.js';
import fashion from './fashion.js';
import minimart from './minimart.js';
import nhomkinh from './nhomkinh.js';
import pharmacy from './pharmacy.js';
import vlxd from './vlxd.js';

const CONFIGS = { nhomkinh, vlxd, minimart, fashion, pharmacy };

// Ordered like EDITION_IDS (also the demo picker order).
export const EDITION_CONFIGS = EDITION_IDS.map((id) => CONFIGS[id]);

export const getEditionConfig = (editionId) => CONFIGS[editionId] || null;

export { DEFAULT_EDITION_ID, EDITION_IDS };
