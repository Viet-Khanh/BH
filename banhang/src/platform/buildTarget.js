import { CUSTOMER_CATALOG } from '../customers/catalog.js';
import {
  DEFAULT_EDITION_ID,
  EDITION_CATALOG,
  EDITION_IDS,
} from '../editions/catalog.js';

const identity = ({
  productName,
  appId,
  installerGuid,
  installerBaseName,
}) => ({
  productName,
  appExeName: `${productName}.exe`,
  appId,
  installerGuid,
  installerBaseName,
});

const resolveCustomer = (customer, edition) => {
  const entry = CUSTOMER_CATALOG[customer];
  if (!entry) {
    const known = Object.keys(CUSTOMER_CATALOG).join(', ');
    throw new Error(`Unknown customer "${customer}". Known: ${known}`);
  }
  if (edition && edition !== entry.edition) {
    throw new Error(
      `Customer "${customer}" extends "${entry.edition}", not "${edition}"`
    );
  }
  return { edition: entry.edition, customer, ...identity(entry) };
};

// Which edition/customer a build contains and how its installer is named.
// Used at build time only (vite.config.js, scripts/buildTarget.mjs).
export const resolveBuildTarget = ({ edition, customer } = {}) => {
  if (customer) return resolveCustomer(customer, edition);
  const editionId = edition || DEFAULT_EDITION_ID;
  const entry = EDITION_CATALOG[editionId];
  if (!entry) {
    throw new Error(
      `Unknown edition "${editionId}". Known: ${EDITION_IDS.join(', ')}`
    );
  }
  return { edition: editionId, customer: null, ...identity(entry) };
};
