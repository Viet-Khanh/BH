// Subset of mongoose.Schema used by banhang-backend models:
// strict casting, defaults, required and unique.
const TRUE_VALUES = new Set([true, 'true', 1, '1', 'yes']);
const FALSE_VALUES = new Set([false, 'false', 0, '0', 'no']);

const castError = (key, value, type) =>
  new Error(`Cast to ${type} failed for value "${value}" at path "${key}"`);

const castScalar = (type, value, key) => {
  if (value === null) return null;
  if (type === Number) {
    if (value === '') return null;
    const number = typeof value === 'object' ? NaN : Number(value);
    if (Number.isNaN(number)) throw castError(key, value, 'Number');
    return number;
  }
  if (type === String) {
    if (typeof value === 'object') throw castError(key, value, 'String');
    return String(value);
  }
  if (type === Boolean) {
    if (TRUE_VALUES.has(value)) return true;
    if (FALSE_VALUES.has(value)) return false;
    throw castError(key, value, 'Boolean');
  }
  return value;
};

const isBlank = (value) =>
  value === undefined || value === null || value === '';

export class Schema {
  constructor(definition = {}, options = {}) {
    this.options = options;
    this.paths = Object.fromEntries(
      Object.entries(definition).map(([key, spec]) => [key, describePath(spec)])
    );
  }

  get uniqueKeys() {
    return Object.keys(this.paths).filter((key) => this.paths[key].unique);
  }

  cast(doc = {}) {
    const result = {};
    if (doc._id !== undefined && this.options._id !== false) {
      result._id = doc._id;
    }
    Object.entries(this.paths).forEach(([key, path]) => {
      const value = castValue(path, doc[key], key);
      if (value !== undefined) result[key] = value;
    });
    return result;
  }

  applyDefaults(doc) {
    const result = { ...doc };
    Object.entries(this.paths).forEach(([key, path]) => {
      if (result[key] !== undefined) return;
      if (path.hasDefault) {
        const fallback = path.default;
        result[key] =
          typeof fallback === 'function'
            ? fallback.call(result)
            : structuredClone(fallback);
      } else if (path.kind === 'array') {
        result[key] = [];
      }
    });
    return result;
  }

  validate(doc, modelName) {
    const missing = Object.entries(this.paths)
      .filter(([key, path]) => path.required && isBlank(doc[key]))
      .map(([key]) => `${key}: Path \`${key}\` is required.`);
    if (missing.length) {
      throw new Error(`${modelName} validation failed: ${missing.join(', ')}`);
    }
  }
}

function describePath(spec) {
  if (Array.isArray(spec)) {
    return { kind: 'array', item: describePath(spec[0]) };
  }
  if (spec instanceof Schema) return { kind: 'schema', schema: spec };
  if (typeof spec === 'function') return { kind: 'scalar', type: spec };
  if (spec && typeof spec === 'object' && 'type' in spec) {
    const { type, ...rules } = spec;
    return { ...describePath(type), ...rules, hasDefault: 'default' in spec };
  }
  return { kind: 'mixed' };
}

function castValue(path, value, key) {
  if (value === undefined) return undefined;
  if (path.kind === 'scalar') return castScalar(path.type, value, key);
  if (path.kind === 'schema') {
    return value === null ? null : path.schema.cast(value);
  }
  if (path.kind === 'array') {
    if (value === null) return null;
    const list = Array.isArray(value) ? value : [value];
    return list.map((item, index) =>
      castValue(path.item, item, `${key}.${index}`)
    );
  }
  return value;
}
