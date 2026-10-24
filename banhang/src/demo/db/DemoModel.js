import { applyUpdate, buildUpsertBase } from './applyUpdate.js';
import { DemoQuery } from './DemoQuery.js';
import { readCollection, writeCollection } from './localStore.js';
import { createObjectId } from './objectId.js';
import {
  createMatcher,
  DemoUnsupportedError,
  projectDoc,
  sortDocs,
} from './queryTools.js';

// Model methods banhang-backend uses. Extend together with backendCompat.test.js.
export const SUPPORTED_MODEL_METHODS = [
  'find',
  'findOne',
  'create',
  'insertMany',
  'findOneAndUpdate',
  'updateMany',
  'deleteMany',
  'bulkWrite',
];

const clone = (value) => structuredClone(value);

const assertOptions = (options, allowed) => {
  Object.keys(options || {}).forEach((key) => {
    if (!allowed.includes(key)) throw new DemoUnsupportedError(`option ${key}`);
  });
};

const duplicateKeyError = (modelName, key, value) =>
  Object.assign(
    new Error(
      `E11000 duplicate key error collection: ${modelName} dup key: { ${key}: "${value}" }`
    ),
    { code: 11000 }
  );

// localStorage-backed stand-in for a mongoose Model (see shims/mongoose.js).
export const createModel = (modelName, schema) => {
  const collection = modelName.toLowerCase();
  const read = () => readCollection(collection);

  const assertUnique = (docs) => {
    schema.uniqueKeys.forEach((key) => {
      const seen = new Set();
      docs.forEach((doc) => {
        const value = doc[key];
        if (value === undefined || value === null) return;
        if (seen.has(value)) throw duplicateKeyError(modelName, key, value);
        seen.add(value);
      });
    });
  };

  const commit = (docs) => {
    assertUnique(docs);
    writeCollection(collection, docs);
  };

  const prepareInsert = (raw) => {
    const doc = schema.applyDefaults(schema.cast(raw));
    schema.validate(doc, modelName);
    return { _id: createObjectId(), ...doc };
  };

  const applyDocUpdate = (doc, update) => schema.cast(applyUpdate(doc, update));

  const insertDocs = (raws) => {
    const created = raws.map(prepareInsert);
    commit([...read(), ...created]);
    return created.map(clone);
  };

  const selectDocs = (filter, { sort, limit } = {}) => {
    let docs = read().filter(createMatcher(filter));
    if (sort) docs = sortDocs(docs, sort);
    if (limit) docs = docs.slice(0, limit);
    return docs;
  };

  const find = (filter = {}, projection) =>
    new DemoQuery((options) =>
      selectDocs(filter, options).map((doc) =>
        projectDoc(clone(doc), projection)
      )
    );

  const findOne = (filter = {}, projection) =>
    new DemoQuery((options) => {
      const [doc] = selectDocs(filter, { ...options, limit: 1 });
      return doc ? projectDoc(clone(doc), projection) : null;
    });

  const findOneAndUpdate = (filter, update, options = {}) => {
    assertOptions(options, ['new', 'upsert']);
    return new DemoQuery(() => {
      const docs = read();
      const index = docs.findIndex(createMatcher(filter));
      if (index === -1) {
        if (!options.upsert) return null;
        const base = applyUpdate(buildUpsertBase(filter), update);
        const created = prepareInsert(base);
        commit([...docs, created]);
        return options.new ? clone(created) : null;
      }
      const next = [...docs];
      next[index] = applyDocUpdate(docs[index], update);
      commit(next);
      return clone(options.new ? next[index] : docs[index]);
    });
  };

  const updateMany = (filter, update, options = {}) => {
    assertOptions(options, []);
    return new DemoQuery(() => {
      const matches = createMatcher(filter);
      let matchedCount = 0;
      const next = read().map((doc) => {
        if (!matches(doc)) return doc;
        matchedCount += 1;
        return applyDocUpdate(doc, update);
      });
      if (matchedCount) commit(next);
      return { acknowledged: true, matchedCount, modifiedCount: matchedCount };
    });
  };

  const deleteMany = (filter = {}) =>
    new DemoQuery(() => {
      const docs = read();
      const matches = createMatcher(filter);
      const next = docs.filter((doc) => !matches(doc));
      if (next.length !== docs.length) commit(next);
      return { acknowledged: true, deletedCount: docs.length - next.length };
    });

  // All-or-nothing: operations apply to a working copy that is committed once.
  const bulkWrite = async (operations = [], options = {}) => {
    assertOptions(options, ['ordered']);
    let next = read();
    let matchedCount = 0;
    operations.forEach((operation) => {
      const [type, ...rest] = Object.keys(operation);
      if (type !== 'updateOne' || rest.length) {
        throw new DemoUnsupportedError(`bulkWrite operation ${type}`);
      }
      const { filter, update, ...opOptions } = operation.updateOne;
      assertOptions(opOptions, []);
      const index = next.findIndex(createMatcher(filter));
      if (index === -1) return;
      next = next.map((doc, i) =>
        i === index ? applyDocUpdate(doc, update) : doc
      );
      matchedCount += 1;
    });
    if (matchedCount) commit(next);
    return { ok: 1, matchedCount, modifiedCount: matchedCount };
  };

  return {
    modelName,
    schema,
    find,
    findOne,
    findOneAndUpdate,
    updateMany,
    deleteMany,
    bulkWrite,
    create: async (input) =>
      Array.isArray(input) ? insertDocs(input) : insertDocs([input])[0],
    insertMany: async (input, options = {}) => {
      assertOptions(options, ['ordered']);
      return insertDocs(Array.isArray(input) ? input : [input]);
    },
  };
};
