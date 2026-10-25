import { DEFAULT_EDITION_ID, getEditionConfig } from './index.js';

let current = null;

const requireConfig = (editionId) => {
  const config = getEditionConfig(editionId);
  if (!config) throw new Error(`Unknown edition "${editionId}"`);
  return config;
};

// Real builds: fixed by VITE_EDITION. Demo: set once by the demo session before <App/> renders.
export const getEdition = () => {
  if (!current) {
    current = requireConfig(import.meta.env.VITE_EDITION || DEFAULT_EDITION_ID);
  }
  return current;
};

export const setEdition = (editionId) => {
  current = requireConfig(editionId);
  return current;
};

export const hasFeature = (name) => Boolean(getEdition().features[name]);

export const applyEditionToDocument = (edition = getEdition()) => {
  if (typeof document !== 'undefined') document.title = edition.appTitle;
};
