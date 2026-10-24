import { Query } from 'mingo';

// Every operator banhang-backend uses. Extend together with backendCompat.test.js.
export const SUPPORTED_QUERY_OPERATORS = [
  '$eq',
  '$ne',
  '$in',
  '$nin',
  '$gt',
  '$gte',
  '$lt',
  '$lte',
  '$exists',
  '$or',
  '$and',
];

export class DemoUnsupportedError extends Error {
  constructor(feature) {
    super(`DemoModel: unsupported ${feature}`);
    this.name = 'DemoUnsupportedError';
  }
}

const collectOperators = (value, found = new Set()) => {
  if (Array.isArray(value)) {
    value.forEach((item) => collectOperators(item, found));
  } else if (value && typeof value === 'object') {
    Object.entries(value).forEach(([key, child]) => {
      if (key.startsWith('$')) found.add(key);
      collectOperators(child, found);
    });
  }
  return found;
};

export const createMatcher = (filter = {}) => {
  collectOperators(filter).forEach((operator) => {
    if (!SUPPORTED_QUERY_OPERATORS.includes(operator)) {
      throw new DemoUnsupportedError(`query operator ${operator}`);
    }
  });
  const query = new Query(filter || {});
  return (doc) => query.test(doc);
};

export const getPath = (doc, path) =>
  path
    .split('.')
    .reduce((value, key) => (value == null ? undefined : value[key]), doc);

// MongoDB sort order across types: null/missing < numbers < strings < objects < booleans.
const TYPE_RANK = { undefined: 0, number: 1, string: 2, object: 3, boolean: 4 };
const typeRank = (value) =>
  value === null ? 0 : (TYPE_RANK[typeof value] ?? 5);

export const compareValues = (left, right) => {
  const rankDiff = typeRank(left) - typeRank(right);
  if (rankDiff !== 0) return rankDiff;
  if (left === right || typeRank(left) === 0) return 0;
  if (left < right) return -1;
  return left > right ? 1 : 0;
};

const toSortFields = (spec) => {
  if (typeof spec === 'string') {
    return spec
      .split(/\s+/)
      .filter(Boolean)
      .map((field) =>
        field.startsWith('-') ? [field.slice(1), -1] : [field, 1]
      );
  }
  return Object.entries(spec || {}).map(([field, direction]) => [
    field,
    direction === 'desc' || Number(direction) < 0 ? -1 : 1,
  ]);
};

export const sortDocs = (docs, spec) => {
  const fields = toSortFields(spec);
  return [...docs].sort((left, right) => {
    for (const [field, direction] of fields) {
      const diff = compareValues(getPath(left, field), getPath(right, field));
      if (diff !== 0) return diff * direction;
    }
    return 0;
  });
};

// Inclusion projections only (e.g. { id: 1, name: 1 }), like the backend uses.
export const projectDoc = (doc, projection) => {
  const entries = Object.entries(projection || {});
  if (!entries.length) return doc;
  if (entries.some(([key, value]) => key !== '_id' && !value)) {
    throw new DemoUnsupportedError('exclusion projection');
  }
  const result = {};
  const includeId = projection._id === undefined || Boolean(projection._id);
  if (includeId && doc._id !== undefined) result._id = doc._id;
  entries.forEach(([key, value]) => {
    if (key !== '_id' && value && doc[key] !== undefined) {
      result[key] = doc[key];
    }
  });
  return result;
};
