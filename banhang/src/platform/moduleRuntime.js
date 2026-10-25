import { customer, editions, selectable } from 'virtual:banhang-modules';
import { composeModules } from './composeModules.js';

const editionsById = new Map(editions.map((edition) => [edition.id, edition]));
let active = null;

const compose = (editionId) => {
  const edition = editionsById.get(editionId);
  if (!edition) throw new Error(`Unknown edition "${editionId}"`);
  return composeModules(edition, customer);
};

// Real builds contain one edition (+ customer); demo/test builds contain every edition.
export const getActiveModule = () => {
  if (!active) active = compose(editions[0].id);
  return active;
};

// Demo/test only: the visitor picks an edition. Real builds cannot switch.
export const setActiveEdition = (editionId) => {
  if (!selectable && editionId !== getActiveModule().editionId) {
    throw new Error('This build contains a single edition');
  }
  active = compose(editionId);
  return active;
};

export const getAvailableEditions = () => editions;

export const getEditionConfig = () => getActiveModule().config;

export const hasFeature = (name) =>
  Boolean(getEditionConfig().features?.[name]);

export const applyEditionToDocument = () => {
  if (typeof document !== 'undefined') {
    document.title = getEditionConfig().appTitle;
  }
};
