import { SLOT_NAMES } from './slots.js';

const EDITION_KEYS = [
  'id',
  'config',
  'routes',
  'homeTiles',
  'hideModules',
  'slots',
];
const CUSTOMER_KEYS = [...EDITION_KEYS, 'extends'];

const fail = (id, message) => {
  throw new Error(`Module "${id}": ${message}`);
};

const validate = (module, allowedKeys) => {
  if (!module?.id) fail('?', 'missing id');
  const { id } = module;
  Object.keys(module).forEach((key) => {
    if (!allowedKeys.includes(key)) fail(id, `unknown key "${key}"`);
  });
  if (!module.config) fail(id, 'missing config');
  Object.keys(module.slots || {}).forEach((name) => {
    if (!SLOT_NAMES.includes(name)) fail(id, `unknown slot "${name}"`);
  });
  (module.routes || []).forEach((route) => {
    if (!route.path || !route.page) fail(id, 'route needs path and page');
  });
  (module.homeTiles || []).forEach((tile) => {
    if (!tile.module || !tile.label) {
      fail(id, 'home tile needs module and label');
    }
  });
};

const normalize = (kind, module) =>
  Object.freeze({
    kind,
    routes: [],
    homeTiles: [],
    hideModules: [],
    slots: {},
    ...module,
  });

export const defineEdition = (module) => {
  validate(module, EDITION_KEYS);
  return normalize('edition', module);
};

// A customer extends exactly one edition and declares only what differs.
export const defineCustomer = (module) => {
  validate(module, CUSTOMER_KEYS);
  if (!module.extends) fail(module.id, 'missing "extends" (edition id)');
  return normalize('customer', module);
};
