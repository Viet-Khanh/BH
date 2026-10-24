import fashion from './fashion/index.js';
import minimart from './minimart/index.js';
import pharmacy from './pharmacy/index.js';
import vlxd from './vlxd/index.js';

// Order = order shown in the edition picker. See ../README.md "Add an edition".
export const EDITIONS = [minimart, vlxd, fashion, pharmacy];

export const getEdition = (editionId) =>
  EDITIONS.find((edition) => edition.id === editionId) || null;
