import { DemoUnsupportedError, getPath } from './queryTools.js';

export const SUPPORTED_UPDATE_OPERATORS = ['$set', '$inc'];

const isOperatorObject = (value) =>
  Boolean(value) &&
  typeof value === 'object' &&
  Object.keys(value).some((key) => key.startsWith('$'));

const setPath = (doc, path, value) => {
  const keys = path.split('.');
  const last = keys.pop();
  const parent = keys.reduce((node, key) => {
    if (node[key] == null || typeof node[key] !== 'object') node[key] = {};
    return node[key];
  }, doc);
  parent[last] = value;
};

// Mongoose treats a plain object update as $set.
const normalizeUpdate = (update = {}) => {
  const keys = Object.keys(update);
  const operators = keys.filter((key) => key.startsWith('$'));
  if (!operators.length) return { $set: update };
  if (operators.length !== keys.length) {
    throw new DemoUnsupportedError('mixed update document');
  }
  operators.forEach((operator) => {
    if (!SUPPORTED_UPDATE_OPERATORS.includes(operator)) {
      throw new DemoUnsupportedError(`update operator ${operator}`);
    }
  });
  return update;
};

export const applyUpdate = (doc, update) => {
  const { $set = {}, $inc = {} } = normalizeUpdate(update);
  const next = structuredClone(doc);
  Object.entries($set)
    .filter(([, value]) => value !== undefined)
    .forEach(([path, value]) => setPath(next, path, structuredClone(value)));
  Object.entries($inc).forEach(([path, value]) => {
    setPath(next, path, Number(getPath(next, path) || 0) + Number(value || 0));
  });
  return next;
};

// Equality conditions of a filter become fields of an upserted document.
export const buildUpsertBase = (filter = {}) =>
  Object.fromEntries(
    Object.entries(filter).filter(
      ([key, value]) => !key.startsWith('$') && !isOperatorObject(value)
    )
  );
