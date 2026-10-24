# Browser Demo Mode Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship a Vercel-hosted demo of BanHang where the real backend code runs in the browser on top of `localStorage`, with four industry editions of sample data.

**Architecture:** Vite aliases `express` and `mongoose` to small in-browser shims; backend routes/controllers/services/models are imported unchanged from `../banhang-backend/src`. A transport switch in `src/db/transport.js` sends requests to `demoApp.dispatch()` instead of `fetch` when the build-time flag `__DEMO__` is true. Demo code is only reachable through dynamic imports guarded by `__DEMO__`, so normal and Electron builds do not ship it.

**Tech Stack:** React 18, Vite 5, Ant Design 5, Vitest 3, mingo 7.2.4 (Mongo query matching), dayjs, uuid.

**Spec:** `docs/superpowers/specs/2026-10-24-browser-demo-mode-design.md`

**Conventions (from `banhang/AGENT.md`):** every source file ≤ 200 lines, JavaScript only, small single-purpose modules, Prettier (`singleQuote`, `semi`, `trailingComma: es5`).

**Known baseline:** two FE tests (`dashboardApi`, `dataUpgradeApi`) fail locally because `banhang/.env` overrides `VITE_API_URL`. They are not touched by this plan. Run them with `VITE_API_URL= npx vitest run` to confirm they pass without the override.

---

## File map

Backend (`banhang-backend/src/`):
- Create `routes/index.js` — `crudModels`, `mountApiRoutes(app)`; shared by real server and demo.
- Modify `app.js` — use `mountApiRoutes`.
- Create `../README.md` — module layout + "services never import mongoose" rule.

Frontend (`banhang/`):
- Modify `vite.config.js`, `.eslintrc.cjs`, `package.json`.
- Create `src/db/transport.js`; modify `src/db/repository.js`, `src/pages/Catalog/openingImportApi.js`.
- Create `src/constants/app.js`; modify `src/App.jsx`, `src/main.jsx`.
- Create `src/demo/**` (see tasks), `vercel.json`.

Docs: root `CLAUDE.md`, `banhang/src/demo/README.md`, update `banhang/AGENT.md`.

---

### Task 1: Share backend route mounting

**Files:**
- Create: `banhang-backend/src/routes/index.js`
- Modify: `banhang-backend/src/app.js`

- [ ] **Step 1: Create `routes/index.js`**

```js
import Cashbook from '../models/Cashbook.js';
import Customer from '../models/Customer.js';
import Product from '../models/Product.js';
import Purchase from '../models/Purchase.js';
import Settings from '../models/Settings.js';
import Supplier from '../models/Supplier.js';
import Unit from '../models/Unit.js';
import { createCrudRouter } from './crud.js';
import dashboardRouter from './dashboard.js';
import dataUpgradeRouter from './dataUpgrade.js';
import invoicesRouter from './invoices.js';
import openingImportRouter from './openingImport.js';
import paymentsRouter from './payments.js';
import productToolsRouter from './productTools.js';
import purchasesRouter from './purchases.js';
import reportRouter from './reports.js';
import salesRouter from './sales.js';

export const crudModels = {
  products: Product,
  customers: Customer,
  suppliers: Supplier,
  purchases: Purchase,
  cashbook: Cashbook,
  settings: Settings,
  units: Unit,
};

const moduleRouters = [
  ['/api/invoices', invoicesRouter],
  ['/api/payments', paymentsRouter],
  ['/api/dashboard', dashboardRouter],
  ['/api/data-upgrade', dataUpgradeRouter],
  ['/api/reports', reportRouter],
  ['/api/sales', salesRouter],
  ['/api/purchases-tools', purchasesRouter],
  ['/api/products-tools', productToolsRouter],
  ['/api/opening-import', openingImportRouter],
];

// Shared by the Express server (app.js) and the browser demo (banhang/src/demo).
export const mountApiRoutes = (app) => {
  Object.entries(crudModels).forEach(([key, model]) => {
    app.use(`/api/${key}`, createCrudRouter(model));
  });
  moduleRouters.forEach(([path, router]) => app.use(path, router));
  return app;
};
```

- [ ] **Step 2: Update `app.js`**

Remove the `createCrudRouter` import and the nine `*Router` imports. Add `import { crudModels, mountApiRoutes } from './routes/index.js';`. Replace the `export const models = {...}` object with `export const models = crudModels;` (keep `seedModels` spreading `models`). Replace the block from `Object.entries(models).forEach(...)` through `app.use('/api/opening-import', openingImportRouter);` with:

```js
  mountApiRoutes(app);
```

Model imports (`Product`, `Customer`, … `Unit`, `Invoice`, `Payment`) stay because `/api/seed` uses them.

- [ ] **Step 3: Run backend tests**

Run: `cd banhang-backend && npx vitest run`
Expected: `Tests 40 passed (40)`

- [ ] **Step 4: Commit**

```bash
git add banhang-backend/src/routes/index.js banhang-backend/src/app.js
git commit -m "refactor(backend): extract shared api route mounting"
```

---

### Task 2: Build tooling for demo mode

**Files:**
- Modify: `banhang/vite.config.js`, `banhang/.eslintrc.cjs`, `banhang/package.json`

- [ ] **Step 1: Add mingo (exact version, released > 2 weeks ago)**

Run: `cd banhang && npm install --save-exact mingo@7.2.4`

- [ ] **Step 2: Replace `vite.config.js`**

```js
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const fromHere = (path) => fileURLToPath(new URL(path, import.meta.url));

export default defineConfig(() => ({
  plugins: [react()],
  base: process.env.ELECTRON ? './' : '/',
  define: {
    // Build-time flag. Demo code is only reachable behind `if (__DEMO__)`.
    __DEMO__: JSON.stringify(process.env.VITE_DEMO === 'true'),
  },
  resolve: {
    alias: {
      '@backend': fromHere('../banhang-backend/src'),
      // The frontend never imports these; only backend code reached by the demo does.
      express: fromHere('./src/demo/shims/express.js'),
      mongoose: fromHere('./src/demo/shims/mongoose.js'),
    },
    // Backend files must use banhang's copies (banhang-backend/node_modules is absent on Vercel).
    dedupe: ['dayjs', 'uuid'],
  },
  server: {
    fs: { allow: [fromHere('..')] },
  },
}));
```

- [ ] **Step 3: Declare the global for ESLint** — in `.eslintrc.cjs` add after `env`:

```js
  globals: {
    __DEMO__: 'readonly',
  },
```

- [ ] **Step 4: Add the build script** — in `package.json` `scripts`:

```json
"build:demo": "cross-env VITE_DEMO=true vite build",
```

- [ ] **Step 5: Verify normal build still works**

Run: `cd banhang && npm run build`
Expected: build succeeds.

- [ ] **Step 6: Commit**

```bash
git add banhang/vite.config.js banhang/.eslintrc.cjs banhang/package.json banhang/package-lock.json
git commit -m "build: add demo flag, backend alias and shims wiring"
```

---

### Task 3: Demo config and localStorage store

**Files:**
- Create: `banhang/src/demo/config.js`
- Create: `banhang/src/demo/db/localStore.js`
- Create: `banhang/src/demo/__tests__/helpers/memoryStorage.js`
- Test: `banhang/src/demo/__tests__/localStore.test.js`

- [ ] **Step 1: Create `config.js`**

```js
// Bump SCHEMA_VERSION when stored demo data shape changes: all demo keys are wiped and reseeded.
export const SCHEMA_VERSION = 1;
export const KEY_ROOT = 'bh-demo';
export const META_KEY = `${KEY_ROOT}:meta`;
export const DATA_KEY_PREFIX = `${KEY_ROOT}:v${SCHEMA_VERSION}`;
export const SEED_DAYS = 30;
export const DEMO_SYSTEM_PASSWORD = '123456';
export const CONTACT_URL = import.meta.env.VITE_CONTACT_URL || '';
```

- [ ] **Step 2: Create test helper `memoryStorage.js`**

```js
// Web Storage compatible in-memory store for tests. quotaBytes simulates a full localStorage.
export const createMemoryStorage = ({ quotaBytes = Infinity } = {}) => {
  const data = new Map();
  const usedBytes = () =>
    [...data.values()].reduce((sum, value) => sum + value.length, 0);

  return {
    get length() {
      return data.size;
    },
    key: (index) => [...data.keys()][index] ?? null,
    getItem: (key) => (data.has(key) ? data.get(key) : null),
    setItem: (key, value) => {
      const text = String(value);
      const previous = data.get(key)?.length || 0;
      if (usedBytes() - previous + text.length > quotaBytes) {
        const error = new Error('Quota exceeded');
        error.name = 'QuotaExceededError';
        throw error;
      }
      data.set(key, text);
    },
    removeItem: (key) => {
      data.delete(key);
    },
    clear: () => data.clear(),
  };
};
```

- [ ] **Step 3: Write the failing test `localStore.test.js`**

```js
import { beforeEach, describe, expect, it } from 'vitest';
import {
  clearNamespace,
  configureStorage,
  findCorruptCollections,
  readCollection,
  setActiveNamespace,
  writeCollection,
} from '../db/localStore.js';
import { createMemoryStorage } from './helpers/memoryStorage.js';

describe('localStore', () => {
  let storage;

  beforeEach(() => {
    storage = createMemoryStorage();
    configureStorage(storage);
    setActiveNamespace('minimart');
  });

  it('persists collections under the namespaced key', () => {
    writeCollection('product', [{ id: 'p1' }]);
    expect(storage.getItem('bh-demo:v1:minimart:product')).toBe(
      '[{"id":"p1"}]'
    );
    configureStorage(storage);
    setActiveNamespace('minimart');
    expect(readCollection('product')).toEqual([{ id: 'p1' }]);
  });

  it('keeps namespaces separate', () => {
    writeCollection('product', [{ id: 'p1' }]);
    setActiveNamespace('vlxd');
    expect(readCollection('product')).toEqual([]);
  });

  it('keeps previous data when the quota is exceeded', () => {
    configureStorage(createMemoryStorage({ quotaBytes: 40 }));
    setActiveNamespace('minimart');
    writeCollection('product', [{ id: 'p1' }]);
    expect(() =>
      writeCollection('product', [{ id: 'p1' }, { id: 'x'.repeat(50) }])
    ).toThrow('Bộ nhớ demo đã đầy');
    expect(readCollection('product')).toEqual([{ id: 'p1' }]);
  });

  it('detects corrupt collections and clears a namespace', () => {
    storage.setItem('bh-demo:v1:minimart:invoice', '{oops');
    expect(findCorruptCollections('minimart')).toEqual([
      'bh-demo:v1:minimart:invoice',
    ]);
    expect(() => readCollection('invoice')).toThrow('Dữ liệu demo bị hỏng');
    clearNamespace('minimart');
    expect(storage.length).toBe(0);
  });

  it('requires an active namespace', () => {
    setActiveNamespace(null);
    expect(() => readCollection('product')).toThrow('Chưa chọn ngành hàng');
  });
});
```

- [ ] **Step 4: Run test to verify it fails**

Run: `cd banhang && npx vitest run src/demo/__tests__/localStore.test.js`
Expected: FAIL — cannot resolve `../db/localStore.js`.

- [ ] **Step 5: Implement `db/localStore.js`**

```js
import { DATA_KEY_PREFIX } from '../config.js';

let storage = globalThis.localStorage ?? null;
let namespace = null;
const cache = new Map();

export class DemoStorageError extends Error {
  constructor(message) {
    super(message);
    this.name = 'DemoStorageError';
  }
}

export const configureStorage = (nextStorage) => {
  storage = nextStorage;
  cache.clear();
};

export const getStorage = () => {
  if (!storage) {
    throw new DemoStorageError('Trình duyệt không hỗ trợ lưu trữ cục bộ.');
  }
  return storage;
};

export const setActiveNamespace = (editionId) => {
  namespace = editionId;
  cache.clear();
};

export const getActiveNamespace = () => namespace;

const namespacePrefix = (editionId) => `${DATA_KEY_PREFIX}:${editionId}:`;

const collectionKey = (collection) => {
  if (!namespace) throw new DemoStorageError('Chưa chọn ngành hàng demo.');
  return `${namespacePrefix(namespace)}${collection}`;
};

const parseCollection = (key, raw) => {
  if (raw === null) return [];
  let parsed = null;
  try {
    parsed = JSON.parse(raw);
  } catch {
    parsed = null;
  }
  if (!Array.isArray(parsed)) {
    throw new DemoStorageError(`Dữ liệu demo bị hỏng (${key}).`);
  }
  return parsed;
};

const isQuotaError = (error) =>
  error?.name === 'QuotaExceededError' ||
  error?.name === 'NS_ERROR_DOM_QUOTA_REACHED' ||
  error?.code === 22;

// Returned arrays are shared cache: callers must treat them as read-only.
export const readCollection = (collection) => {
  const key = collectionKey(collection);
  if (!cache.has(key)) {
    cache.set(key, parseCollection(key, getStorage().getItem(key)));
  }
  return cache.get(key);
};

// Writes storage first so a failed write leaves the cache (and data) untouched.
export const writeCollection = (collection, docs) => {
  const key = collectionKey(collection);
  try {
    getStorage().setItem(key, JSON.stringify(docs));
  } catch (error) {
    if (isQuotaError(error)) {
      throw new DemoStorageError(
        'Bộ nhớ demo đã đầy. Hãy khôi phục dữ liệu mẫu hoặc xuất Excel rồi xoá bớt dữ liệu.'
      );
    }
    throw error;
  }
  cache.set(key, docs);
};

const listKeys = (prefix) => {
  const target = getStorage();
  const keys = [];
  for (let index = 0; index < target.length; index += 1) {
    const key = target.key(index);
    if (key?.startsWith(prefix)) keys.push(key);
  }
  return keys;
};

export const removeKeysWithPrefix = (prefix) => {
  listKeys(prefix).forEach((key) => getStorage().removeItem(key));
  cache.clear();
};

export const clearNamespace = (editionId) =>
  removeKeysWithPrefix(namespacePrefix(editionId));

export const findCorruptCollections = (editionId) =>
  listKeys(namespacePrefix(editionId)).filter((key) => {
    try {
      parseCollection(key, getStorage().getItem(key));
      return false;
    } catch {
      return true;
    }
  });

export const isStorageAvailable = () => {
  try {
    const probe = `${DATA_KEY_PREFIX}:probe`;
    getStorage().setItem(probe, '1');
    getStorage().removeItem(probe);
    return true;
  } catch {
    return false;
  }
};
```

- [ ] **Step 6: Run test to verify it passes**

Run: `cd banhang && npx vitest run src/demo/__tests__/localStore.test.js`
Expected: PASS (5 tests)

- [ ] **Step 7: Commit**

```bash
git add banhang/src/demo/config.js banhang/src/demo/db/localStore.js banhang/src/demo/__tests__
git commit -m "feat(demo): add namespaced localStorage collection store"
```

---

### Task 4: Mongoose-compatible Schema

**Files:**
- Create: `banhang/src/demo/db/schema.js`
- Test: `banhang/src/demo/__tests__/schema.test.js`

- [ ] **Step 1: Write the failing test**

```js
import { describe, expect, it } from 'vitest';
import { Schema } from '../db/schema.js';

const ItemSchema = new Schema({ productId: String, qty: Number }, { _id: false });
const OrderSchema = new Schema({
  id: { type: String, required: true, unique: true },
  total: Number,
  paid: { type: Boolean, default: false },
  stock: {
    type: Number,
    default() {
      return Number(this.openingStock || 0);
    },
  },
  openingStock: Number,
  items: [ItemSchema],
});

describe('Schema', () => {
  it('drops unknown fields and casts scalars (strict mode)', () => {
    const doc = OrderSchema.cast({
      _id: 'x',
      id: 7,
      total: '1500',
      extra: 'gone',
      items: [{ productId: 'p', qty: '2', junk: 1 }],
    });
    expect(doc).toEqual({
      _id: 'x',
      id: '7',
      total: 1500,
      items: [{ productId: 'p', qty: 2 }],
    });
  });

  it('casts empty string numbers to null and rejects garbage', () => {
    expect(OrderSchema.cast({ total: '' }).total).toBeNull();
    expect(() => OrderSchema.cast({ total: 'abc' })).toThrow(
      'Cast to Number failed'
    );
  });

  it('applies defaults, including function defaults bound to the doc', () => {
    const doc = OrderSchema.applyDefaults({ id: 'a', openingStock: 5 });
    expect(doc).toMatchObject({ paid: false, stock: 5, items: [] });
  });

  it('validates required fields and exposes unique keys', () => {
    expect(() => OrderSchema.validate({}, 'Order')).toThrow(
      'Order validation failed: id'
    );
    expect(OrderSchema.uniqueKeys).toEqual(['id']);
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `cd banhang && npx vitest run src/demo/__tests__/schema.test.js`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement `db/schema.js`**

```js
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

const isBlank = (value) =>
  value === undefined || value === null || value === '';

function describePath(spec) {
  if (Array.isArray(spec)) return { kind: 'array', item: describePath(spec[0]) };
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
  if (path.kind === 'schema') return value === null ? null : path.schema.cast(value);
  if (path.kind === 'array') {
    if (value === null) return null;
    const list = Array.isArray(value) ? value : [value];
    return list.map((item, index) => castValue(path.item, item, `${key}.${index}`));
  }
  return value;
}
```

- [ ] **Step 4: Run to verify it passes**

Run: `cd banhang && npx vitest run src/demo/__tests__/schema.test.js`
Expected: PASS (4 tests)

- [ ] **Step 5: Commit**

```bash
git add banhang/src/demo/db/schema.js banhang/src/demo/__tests__/schema.test.js
git commit -m "feat(demo): add mongoose-compatible schema casting"
```

---

### Task 5: Query tools, updates and DemoModel

**Files:**
- Create: `banhang/src/demo/db/queryTools.js`, `applyUpdate.js`, `DemoQuery.js`, `objectId.js`, `DemoModel.js`
- Test: `banhang/src/demo/__tests__/demoModel.test.js`

- [ ] **Step 1: Write the failing test**

```js
import { beforeEach, describe, expect, it } from 'vitest';
import { createModel } from '../db/DemoModel.js';
import { configureStorage, setActiveNamespace } from '../db/localStore.js';
import { Schema } from '../db/schema.js';
import { createMemoryStorage } from './helpers/memoryStorage.js';

const Product = createModel(
  'Product',
  new Schema({
    id: { type: String, required: true, unique: true },
    name: String,
    stock: Number,
    isDeleted: { type: Boolean, default: false },
    items: [new Schema({ productId: String }, { _id: false })],
  })
);

const seed = () =>
  Product.insertMany(
    [
      { id: 'a', name: 'Bia', stock: 5 },
      { id: 'b', name: 'An', stock: 0, items: [{ productId: 'x' }] },
      { id: 'c', name: 'Ca', stock: 9, isDeleted: true },
    ],
    { ordered: false }
  );

describe('DemoModel', () => {
  beforeEach(async () => {
    configureStorage(createMemoryStorage());
    setActiveNamespace('test');
    await seed();
  });

  it('finds with filter, sort, limit and projection', async () => {
    const docs = await Product.find({ isDeleted: { $ne: true } }, { id: 1 })
      .sort({ name: 1 })
      .limit(1)
      .lean();
    expect(docs).toHaveLength(1);
    expect(docs[0]).toMatchObject({ id: 'b' });
    expect(docs[0].name).toBeUndefined();
    expect(docs[0]._id).toMatch(/^[0-9a-f]{24}$/);
  });

  it('supports dotted array queries and $or/$in/$gte', async () => {
    expect(await Product.findOne({ 'items.productId': { $in: ['x'] } })).toMatchObject({ id: 'b' });
    const docs = await Product.find({ $or: [{ stock: { $gte: 9 } }, { id: 'a' }] }).sort({ _id: -1 });
    expect(docs.map((doc) => doc.id)).toEqual(['c', 'a']);
  });

  it('returns copies that cannot mutate stored data', async () => {
    const doc = await Product.findOne({ id: 'a' }).lean();
    doc.name = 'changed';
    expect((await Product.findOne({ id: 'a' })).name).toBe('Bia');
  });

  it('findOneAndUpdate applies $set/$inc and honours new/upsert', async () => {
    const before = await Product.findOneAndUpdate({ id: 'a' }, { $inc: { stock: -2 } });
    expect(before.stock).toBe(5);
    const after = await Product.findOneAndUpdate(
      { id: 'a' },
      { $set: { name: 'Bia 333', ignored: undefined } },
      { new: true }
    ).lean();
    expect(after).toMatchObject({ name: 'Bia 333', stock: 3 });
    expect(await Product.findOneAndUpdate({ id: 'z' }, { $set: { name: 'Z' } })).toBeNull();
    const created = await Product.findOneAndUpdate(
      { id: 'z' },
      { $set: { name: 'Z' } },
      { new: true, upsert: true }
    ).lean();
    expect(created).toMatchObject({ id: 'z', name: 'Z', isDeleted: false });
  });

  it('bulkWrite, updateMany and deleteMany', async () => {
    const result = await Product.bulkWrite(
      [{ updateOne: { filter: { id: 'b' }, update: { $inc: { stock: 4 } } } }],
      { ordered: true }
    );
    expect(result.matchedCount).toBe(1);
    expect((await Product.findOne({ id: 'b' })).stock).toBe(4);
    expect((await Product.updateMany({ isDeleted: true }, { $set: { stock: 0 } })).matchedCount).toBe(1);
    expect((await Product.deleteMany({ stock: 0 })).deletedCount).toBe(1);
    expect(await Product.find({})).toHaveLength(2);
  });

  it('enforces unique keys and required fields', async () => {
    await expect(Product.create({ id: 'a' })).rejects.toThrow('E11000');
    await expect(Product.create({ name: 'no id' })).rejects.toThrow('validation failed');
    expect(await Product.find({})).toHaveLength(3);
  });

  it('fails loudly on unsupported features', async () => {
    await expect(Product.find({ name: { $regex: 'B' } })).rejects.toThrow(
      'DemoModel: unsupported query operator $regex'
    );
    await expect(Product.findOneAndUpdate({ id: 'a' }, { $push: { items: {} } })).rejects.toThrow(
      'DemoModel: unsupported update operator $push'
    );
    expect(() => Product.findOneAndUpdate({ id: 'a' }, {}, { session: 1 })).toThrow(
      'DemoModel: unsupported option session'
    );
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `cd banhang && npx vitest run src/demo/__tests__/demoModel.test.js`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement `db/queryTools.js`**

```js
import { Query } from 'mingo';

// Every operator banhang-backend uses. Extend together with backendCompat.test.js.
export const SUPPORTED_QUERY_OPERATORS = [
  '$eq', '$ne', '$in', '$nin', '$gt', '$gte', '$lt', '$lte', '$exists', '$or', '$and',
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
  path.split('.').reduce((value, key) => (value == null ? undefined : value[key]), doc);

// MongoDB sort order across types: null/missing < numbers < strings < objects < booleans.
const TYPE_RANK = { undefined: 0, number: 1, string: 2, object: 3, boolean: 4 };
const typeRank = (value) => (value === null ? 0 : (TYPE_RANK[typeof value] ?? 5));

export const compareValues = (left, right) => {
  const rankDiff = typeRank(left) - typeRank(right);
  if (rankDiff !== 0) return rankDiff;
  if (left === right || typeRank(left) === 0) return 0;
  return left < right ? -1 : left > right ? 1 : 0;
};

const toSortFields = (spec) =>
  typeof spec === 'string'
    ? spec.split(/\s+/).filter(Boolean).map((field) =>
        field.startsWith('-') ? [field.slice(1), -1] : [field, 1])
    : Object.entries(spec || {}).map(([field, direction]) => [
        field,
        direction === 'desc' || Number(direction) < 0 ? -1 : 1,
      ]);

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
    if (key !== '_id' && value && doc[key] !== undefined) result[key] = doc[key];
  });
  return result;
};
```

- [ ] **Step 4: Implement `db/applyUpdate.js`**

```js
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
```

- [ ] **Step 5: Implement `db/DemoQuery.js`**

```js
// Chainable, thenable query like mongoose.Query. lean() is a no-op: results are plain objects.
export class DemoQuery {
  constructor(executor) {
    this.executor = executor;
    this.options = {};
  }

  sort(spec) {
    this.options.sort = spec;
    return this;
  }

  limit(count) {
    this.options.limit = Number(count) || 0;
    return this;
  }

  lean() {
    return this;
  }

  exec() {
    return Promise.resolve().then(() => this.executor(this.options));
  }

  then(onFulfilled, onRejected) {
    return this.exec().then(onFulfilled, onRejected);
  }

  catch(onRejected) {
    return this.exec().catch(onRejected);
  }
}
```

- [ ] **Step 6: Implement `db/objectId.js`**

```js
let counter = 0;

// 24 hex chars: 12 time + 6 counter + 6 random. Increases with insertion order like ObjectId.
export const createObjectId = () => {
  counter = (counter + 1) % 0xffffff;
  const time = Date.now().toString(16).padStart(12, '0');
  const sequence = counter.toString(16).padStart(6, '0');
  const random = Math.floor(Math.random() * 0xffffff).toString(16).padStart(6, '0');
  return `${time}${sequence}${random}`;
};
```

- [ ] **Step 7: Implement `db/DemoModel.js`**

```js
import { applyUpdate, buildUpsertBase } from './applyUpdate.js';
import { DemoQuery } from './DemoQuery.js';
import { readCollection, writeCollection } from './localStore.js';
import { createObjectId } from './objectId.js';
import { createMatcher, DemoUnsupportedError, projectDoc, sortDocs } from './queryTools.js';

// Model methods banhang-backend uses. Extend together with backendCompat.test.js.
export const SUPPORTED_MODEL_METHODS = [
  'find', 'findOne', 'create', 'insertMany', 'findOneAndUpdate',
  'updateMany', 'deleteMany', 'bulkWrite',
];

const clone = (value) => structuredClone(value);

const assertOptions = (options, allowed) => {
  Object.keys(options || {}).forEach((key) => {
    if (!allowed.includes(key)) throw new DemoUnsupportedError(`option ${key}`);
  });
};

const duplicateKeyError = (modelName, key, value) =>
  Object.assign(
    new Error(`E11000 duplicate key error collection: ${modelName} dup key: { ${key}: "${value}" }`),
    { code: 11000 }
  );

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
      selectDocs(filter, options).map((doc) => projectDoc(clone(doc), projection))
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
        const created = prepareInsert(applyUpdate(buildUpsertBase(filter), update));
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
      next = next.map((doc, i) => (i === index ? applyDocUpdate(doc, update) : doc));
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
```

- [ ] **Step 8: Run to verify it passes**

Run: `cd banhang && npx vitest run src/demo/__tests__/demoModel.test.js`
Expected: PASS (7 tests)

- [ ] **Step 9: Commit**

```bash
git add banhang/src/demo/db banhang/src/demo/__tests__/demoModel.test.js
git commit -m "feat(demo): add localStorage-backed mongoose model"
```

---

### Task 6: express and mongoose shims

**Files:**
- Create: `banhang/src/demo/shims/express.js`, `banhang/src/demo/shims/mongoose.js`
- Test: `banhang/src/demo/__tests__/expressShim.test.js`

- [ ] **Step 1: Write the failing test**

```js
import { describe, expect, it } from 'vitest';
import express, { createResponse } from '../shims/express.js';

const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

const buildApp = () => {
  const items = express.Router();
  items.get('/', (req, res) => res.json({ list: true, q: req.query.q }));
  items.get('/recent', (req, res) => res.json({ recent: true }));
  items.get('/:id', (req, res) => res.json({ id: req.params.id }));
  items.post('/', asyncHandler(async (req, res) => res.status(201).json(req.body)));
  items.delete('/:id', asyncHandler(async () => {
    throw new Error('boom');
  }));
  const app = express();
  app.use('/api/items', items);
  return app;
};

const call = async (app, method, path, { query = {}, body } = {}) => {
  const res = createResponse();
  const req = { method, path, query, params: {}, body };
  const handled = await app.handle(req, res);
  return { handled, res };
};

describe('express shim', () => {
  it('routes by method, mount prefix and params', async () => {
    const app = buildApp();
    expect((await call(app, 'GET', '/api/items', { query: { q: 'x' } })).res.body).toEqual({ list: true, q: 'x' });
    expect((await call(app, 'GET', '/api/items/recent')).res.body).toEqual({ recent: true });
    expect((await call(app, 'GET', '/api/items/a%20b')).res.body).toEqual({ id: 'a b' });
    const created = await call(app, 'POST', '/api/items/', { body: { n: 1 } });
    expect(created.res.statusCode).toBe(201);
    expect(created.res.body).toEqual({ n: 1 });
  });

  it('reports unmatched routes and propagates handler errors', async () => {
    const app = buildApp();
    expect((await call(app, 'PUT', '/api/items/1')).handled).toBe(false);
    expect((await call(app, 'GET', '/api/other')).handled).toBe(false);
    await expect(call(app, 'DELETE', '/api/items/1')).rejects.toThrow('boom');
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `cd banhang && npx vitest run src/demo/__tests__/expressShim.test.js`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement `shims/express.js`**

```js
// Minimal Express replacement for running banhang-backend routers in the browser.
// Supports: express(), express.Router(), use(path, router), get/post/put/delete with :params.
const ROUTE_METHODS = ['get', 'post', 'put', 'delete'];

const trimTrailingSlash = (path) =>
  path.length > 1 ? path.replace(/\/+$/, '') : path;

const compileRoutePath = (path) => {
  const keys = [];
  const source = trimTrailingSlash(path)
    .replace(/[.+*?^${}()|[\]\\]/g, '\\$&')
    .replace(/:(\w+)/g, (_, key) => {
      keys.push(key);
      return '([^/]+)';
    });
  return { keys, regex: new RegExp(`^${source === '/' ? '' : source}/?$`) };
};

const matchParams = (layer, path) => {
  const match = layer.regex.exec(path);
  if (!match) return null;
  return Object.fromEntries(
    layer.keys.map((key, index) => [key, decodeURIComponent(match[index + 1])])
  );
};

const stripMountPrefix = (prefix, path) => {
  if (prefix === '/') return path;
  if (path === prefix) return '/';
  return path.startsWith(`${prefix}/`) ? path.slice(prefix.length) : null;
};

// Resolves true when a handler answered; throws errors passed to next(error).
const runHandlers = async (handlers, req, res) => {
  for (const handler of handlers) {
    let nextCalled = false;
    let nextError = null;
    await handler(req, res, (error) => {
      nextCalled = true;
      nextError = error || null;
    });
    if (nextError) throw nextError;
    if (!nextCalled || res.finished) return true;
  }
  return false;
};

export const createRouter = () => {
  const layers = [];
  const router = {
    use(prefix, child) {
      if (typeof prefix !== 'string' || typeof child?.handle !== 'function') {
        throw new Error('express shim: only use(path, router) is supported');
      }
      layers.push({ prefix: trimTrailingSlash(prefix), child });
      return router;
    },
    async handle(req, res, path = req.path) {
      for (const layer of layers) {
        if (layer.child) {
          const rest = stripMountPrefix(layer.prefix, path);
          if (rest !== null && (await layer.child.handle(req, res, rest))) return true;
          continue;
        }
        if (layer.method !== req.method) continue;
        const params = matchParams(layer, path);
        if (!params) continue;
        req.params = params;
        if (await runHandlers(layer.handlers, req, res)) return true;
      }
      return false;
    },
  };
  ROUTE_METHODS.forEach((method) => {
    router[method] = (path, ...handlers) => {
      layers.push({ method: method.toUpperCase(), handlers, ...compileRoutePath(path) });
      return router;
    };
  });
  return router;
};

export const createResponse = () => ({
  statusCode: 200,
  body: undefined,
  finished: false,
  status(code) {
    this.statusCode = code;
    return this;
  },
  json(data) {
    this.body = data;
    this.finished = true;
    return this;
  },
});

const express = () => createRouter();
express.Router = createRouter;

export { createRouter as Router };
export default express;
```

- [ ] **Step 4: Implement `shims/mongoose.js`**

```js
// Browser replacement for mongoose: models persist to localStorage (see ../db).
import { createModel } from '../db/DemoModel.js';
import { Schema } from '../db/schema.js';

const models = {};

export const model = (name, schema) => {
  if (!models[name]) models[name] = createModel(name, schema);
  return models[name];
};

const mongoose = { Schema, model, models };

export { Schema };
export default mongoose;
```

- [ ] **Step 5: Run to verify it passes**

Run: `cd banhang && npx vitest run src/demo/__tests__/expressShim.test.js`
Expected: PASS (2 tests)

- [ ] **Step 6: Commit**

```bash
git add banhang/src/demo/shims banhang/src/demo/__tests__/expressShim.test.js
git commit -m "feat(demo): add express and mongoose browser shims"
```

---

### Task 7: demoApp dispatcher and backend compatibility guard

**Files:**
- Create: `banhang/src/demo/demoApp.js`, `banhang/src/demo/demoSystemRoutes.js`, `banhang/src/demo/session/demoMeta.js`
- Test: `banhang/src/demo/__tests__/backendCompat.test.js`

- [ ] **Step 1: Write the guard test (fails only if backend uses something unsupported)**

```js
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { SUPPORTED_UPDATE_OPERATORS } from '../db/applyUpdate.js';
import { SUPPORTED_MODEL_METHODS } from '../db/DemoModel.js';
import { SUPPORTED_QUERY_OPERATORS } from '../db/queryTools.js';

const BACKEND_SRC = fileURLToPath(new URL('../../../../banhang-backend/src', import.meta.url));
// app.js, index.js and seedData.js only run in the real server.
const SERVER_ONLY = new Set(['app.js', 'index.js', 'seedData.js']);
const MODEL_NAMES = 'Model|Product|Customer|Supplier|Purchase|Invoice|Payment|Cashbook|Settings|Unit';
const QUERY_ONLY_METHODS = ['select', 'populate', 'skip', 'exec', 'distinct', 'countDocuments', 'aggregate', 'session', 'cursor'];

const listSources = (dir) =>
  readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return name === '__tests__' ? [] : listSources(path);
    return name.endsWith('.js') && !SERVER_ONLY.has(name) ? [path] : [];
  });

const sources = listSources(BACKEND_SRC).map((path) => ({ path, code: readFileSync(path, 'utf8') }));
const collect = (regex) =>
  [...new Set(sources.flatMap(({ code }) => [...code.matchAll(regex)].map((match) => match[1])))];

describe('backend compatibility with demo shims', () => {
  it('only uses supported model methods', () => {
    const used = collect(new RegExp(`\\b(?:${MODEL_NAMES})\\.([a-zA-Z]+)\\(`, 'g'));
    expect(used.filter((name) => !SUPPORTED_MODEL_METHODS.includes(name))).toEqual([]);
  });

  it('only uses supported query/update operators', () => {
    const supported = [...SUPPORTED_QUERY_OPERATORS, ...SUPPORTED_UPDATE_OPERATORS];
    const used = collect(/(?<![\w$])(\$[a-zA-Z]+)\b/g);
    expect(used.filter((operator) => !supported.includes(operator))).toEqual([]);
  });

  it('never calls mongoose-only query helpers', () => {
    const used = collect(new RegExp(`\\.(${QUERY_ONLY_METHODS.join('|')})\\(`, 'g'));
    expect(used).toEqual([]);
  });

  it('services and modules never import mongoose directly', () => {
    const offenders = sources
      .filter(({ path }) => !path.includes('/models/'))
      .filter(({ code }) => /from ['"]mongoose['"]/.test(code))
      .map(({ path }) => path);
    expect(offenders).toEqual([]);
  });
});
```

- [ ] **Step 2: Run it**

Run: `cd banhang && npx vitest run src/demo/__tests__/backendCompat.test.js`
Expected: PASS (4 tests). If it fails, the backend uses a feature the shims lack: extend the shim and its tests, never the allowlist alone.

- [ ] **Step 3: Implement `session/demoMeta.js`**

```js
import { KEY_ROOT, META_KEY, SCHEMA_VERSION } from '../config.js';
import { getStorage, removeKeysWithPrefix } from '../db/localStore.js';

const emptyMeta = () => ({ schemaVersion: SCHEMA_VERSION, activeEdition: null, editions: {} });

export const readMeta = () => {
  try {
    const parsed = JSON.parse(getStorage().getItem(META_KEY) || 'null');
    return parsed && typeof parsed === 'object' ? { ...emptyMeta(), ...parsed } : emptyMeta();
  } catch {
    return emptyMeta();
  }
};

const writeMeta = (meta) => getStorage().setItem(META_KEY, JSON.stringify(meta));

const updateMeta = (updater) => {
  const next = updater(readMeta());
  writeMeta(next);
  return next;
};

// Returns true when stored data came from another schema version and was wiped.
export const ensureSchemaVersion = () => {
  if (readMeta().schemaVersion === SCHEMA_VERSION) return false;
  removeKeysWithPrefix(`${KEY_ROOT}:`);
  writeMeta(emptyMeta());
  return true;
};

export const setActiveEdition = (editionId) =>
  updateMeta((meta) => ({ ...meta, activeEdition: editionId }));

export const markEditionSeeded = (editionId) =>
  updateMeta((meta) => ({
    ...meta,
    editions: { ...meta.editions, [editionId]: { seededAt: new Date().toISOString() } },
  }));

export const isEditionSeeded = (editionId) =>
  Boolean(readMeta().editions[editionId]?.seededAt);
```

- [ ] **Step 4: Implement `demoSystemRoutes.js`**

```js
import { clearNamespace, getActiveNamespace } from './db/localStore.js';
import { seedEdition } from './seed/seedEdition.js';
import { markEditionSeeded } from './session/demoMeta.js';

// Demo versions of the server-only routes defined in banhang-backend/src/app.js.
export const registerDemoSystemRoutes = (app, { dispatch }) => {
  app.get('/api/health', (req, res) => res.json({ ok: true, demo: true }));

  app.post('/api/reset', (req, res) => {
    clearNamespace(getActiveNamespace());
    res.json({ ok: true });
  });

  app.post('/api/seed', async (req, res) => {
    const editionId = getActiveNamespace();
    await seedEdition(editionId, { dispatch });
    markEditionSeeded(editionId);
    res.json({ ok: true });
  });
};
```

- [ ] **Step 5: Implement `demoApp.js`**

```js
import { mountApiRoutes } from '@backend/routes/index.js';
import { registerDemoSystemRoutes } from './demoSystemRoutes.js';
import { createResponse, createRouter } from './shims/express.js';

const app = createRouter();

// Mimics the JSON round trip of a real HTTP call (drops undefined, copies objects).
const toWire = (value) => (value === undefined ? null : JSON.parse(JSON.stringify(value)));

// In-browser replacement for an HTTP request to banhang-backend.
export const dispatch = async ({ method = 'GET', path, body } = {}) => {
  const url = new URL(path, 'http://demo.local');
  const req = {
    method: method.toUpperCase(),
    path: url.pathname,
    query: Object.fromEntries(url.searchParams),
    params: {},
    body: body === undefined ? {} : toWire(body),
  };
  const res = createResponse();
  try {
    const handled = await app.handle(req, res, url.pathname);
    if (!handled) return { status: 404, data: { message: 'Not found' } };
    return { status: res.statusCode, data: toWire(res.body) };
  } catch (error) {
    console.error(error);
    return { status: 500, data: { message: error?.message || 'Server error' } };
  }
};

registerDemoSystemRoutes(app, { dispatch });
mountApiRoutes(app);
```

(`seed/seedEdition.js` is created in Task 9; Task 7's commit only needs the guard test to pass.)

- [ ] **Step 6: Commit**

```bash
git add banhang/src/demo/demoApp.js banhang/src/demo/demoSystemRoutes.js banhang/src/demo/session/demoMeta.js banhang/src/demo/__tests__/backendCompat.test.js
git commit -m "feat(demo): add in-browser dispatcher and backend compatibility guard"
```

---

### Task 8: Edition data

**Files:**
- Create: `banhang/src/demo/editions/index.js`
- Create: `banhang/src/demo/editions/{minimart,vlxd,fashion,pharmacy}/index.js` and `products.js`
- Test: `banhang/src/demo/__tests__/editions.test.js`

Product rows are arrays: `[group, name, unit, spec, avgCost, sellPriceDefault, sellPriceWholesale, openingStock]`. Customer `profile` is `walkin` (exactly one, named `Khách lẻ` — the sales screen selects it by name), `regular` (pays in full) or `debtor` (may owe).

- [ ] **Step 1: Write the failing test**

```js
import { describe, expect, it } from 'vitest';
import { EDITIONS, getEdition } from '../editions/index.js';

describe.each(EDITIONS)('edition $id', (edition) => {
  it('has complete metadata', () => {
    ['id', 'name', 'tagline', 'appTitle', 'codePrefix'].forEach((key) => expect(edition[key]).toBeTruthy());
    expect(edition.shop.name).toBeTruthy();
    expect(Number.isInteger(edition.seed)).toBe(true);
  });

  it('has sane products', () => {
    expect(edition.products.length).toBeGreaterThanOrEqual(25);
    const names = new Set();
    edition.products.forEach((row) => {
      const [group, name, unit, , cost, retail, wholesale, stock] = row;
      expect(row).toHaveLength(8);
      expect(group && name).toBeTruthy();
      expect(edition.units).toContain(unit);
      expect(cost).toBeGreaterThan(0);
      expect(wholesale).toBeGreaterThanOrEqual(cost);
      expect(retail).toBeGreaterThanOrEqual(wholesale);
      expect(stock).toBeGreaterThan(0);
      expect(names.has(name.toLowerCase())).toBe(false);
      names.add(name.toLowerCase());
    });
  });

  it('has customers, suppliers, expenses and activity knobs', () => {
    expect(edition.customers.length).toBeGreaterThanOrEqual(8);
    expect(edition.customers.filter((c) => c.profile === 'walkin').map((c) => c.name)).toEqual(['Khách lẻ']);
    expect(edition.customers.some((c) => c.profile === 'debtor')).toBe(true);
    expect(edition.suppliers.length).toBeGreaterThanOrEqual(3);
    expect(edition.expenses.length).toBeGreaterThan(0);
    const { invoicesPerDay, maxQty, purchaseQty, walkInRatio } = edition.activity;
    expect(invoicesPerDay[0]).toBeLessThanOrEqual(invoicesPerDay[1]);
    expect(purchaseQty[0]).toBeLessThanOrEqual(purchaseQty[1]);
    expect(maxQty).toBeGreaterThan(0);
    expect(walkInRatio).toBeGreaterThan(0);
  });
});

it('looks editions up by id', () => {
  expect(getEdition('vlxd').id).toBe('vlxd');
  expect(getEdition('nope')).toBeNull();
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `cd banhang && npx vitest run src/demo/__tests__/editions.test.js`
Expected: FAIL — module not found.

- [ ] **Step 3: Create `editions/index.js`**

```js
import fashion from './fashion/index.js';
import minimart from './minimart/index.js';
import pharmacy from './pharmacy/index.js';
import vlxd from './vlxd/index.js';

// Order = order shown in the edition picker. See ../README.md "Add an edition".
export const EDITIONS = [minimart, vlxd, fashion, pharmacy];

export const getEdition = (editionId) =>
  EDITIONS.find((edition) => edition.id === editionId) || null;
```

- [ ] **Step 4: Create `editions/minimart/products.js`**

```js
// [group, name, unit, spec, avgCost, sellPriceDefault, sellPriceWholesale, openingStock]
export default [
  ['Đồ uống', 'Nước suối Aquafina 500ml', 'chai', '500ml', 3500, 5000, 4500, 120],
  ['Đồ uống', 'Coca-Cola lon 320ml', 'lon', '320ml', 7000, 10000, 9000, 96],
  ['Đồ uống', 'Pepsi lon 320ml', 'lon', '320ml', 6800, 10000, 8800, 96],
  ['Đồ uống', 'Trà xanh 0 độ 455ml', 'chai', '455ml', 7500, 10000, 9200, 72],
  ['Đồ uống', 'Sting dâu 330ml', 'chai', '330ml', 7200, 10000, 9000, 72],
  ['Đồ uống', 'Bia Sài Gòn Lager lon 330ml', 'lon', '330ml', 10500, 13000, 12000, 120],
  ['Đồ uống', 'Sữa tươi Vinamilk 180ml', 'hộp', '180ml', 6200, 8000, 7200, 96],
  ['Đồ uống', 'Sữa đậu nành Fami 200ml', 'hộp', '200ml', 4300, 6000, 5200, 80],
  ['Mì - đồ khô', 'Mì Hảo Hảo tôm chua cay', 'gói', '75g', 3600, 5000, 4300, 150],
  ['Mì - đồ khô', 'Mì Omachi sườn hầm', 'gói', '80g', 6800, 9000, 8000, 90],
  ['Mì - đồ khô', 'Phở bò Vifon', 'gói', '65g', 6000, 8000, 7200, 60],
  ['Mì - đồ khô', 'Gạo ST25 túi 5kg', 'bịch', '5kg', 150000, 185000, 175000, 20],
  ['Mì - đồ khô', 'Đường cát trắng 1kg', 'bịch', '1kg', 22000, 28000, 26000, 30],
  ['Mì - đồ khô', 'Bột ngọt Ajinomoto 400g', 'gói', '400g', 32000, 39000, 37000, 25],
  ['Gia vị', 'Nước mắm Nam Ngư 500ml', 'chai', '500ml', 18000, 24000, 22000, 40],
  ['Gia vị', 'Dầu ăn Tường An 1L', 'chai', '1L', 42000, 52000, 49000, 30],
  ['Gia vị', 'Nước tương Maggi 300ml', 'chai', '300ml', 14000, 19000, 17500, 36],
  ['Gia vị', 'Muối i-ốt 500g', 'gói', '500g', 4500, 7000, 6000, 40],
  ['Gia vị', 'Hạt nêm Knorr 400g', 'gói', '400g', 33000, 41000, 39000, 24],
  ['Bánh kẹo', 'Bánh Chocopie hộp 12 cái', 'hộp', '12 cái', 48000, 58000, 55000, 20],
  ['Bánh kẹo', 'Bánh quy Cosy 336g', 'hộp', '336g', 38000, 47000, 44000, 18],
  ['Bánh kẹo', 'Snack Oishi tôm cay 40g', 'gói', '40g', 4200, 6000, 5300, 80],
  ['Bánh kẹo', 'Kẹo Alpenliebe gói 120g', 'gói', '120g', 15000, 20000, 18500, 30],
  ['Hoá phẩm', 'Bột giặt OMO 800g', 'gói', '800g', 39000, 48000, 45500, 24],
  ['Hoá phẩm', 'Nước rửa chén Sunlight 750g', 'chai', '750g', 26000, 33000, 31000, 24],
  ['Hoá phẩm', 'Dầu gội Clear 340g', 'chai', '340g', 85000, 105000, 99000, 12],
  ['Hoá phẩm', 'Kem đánh răng P/S 180g', 'cái', '180g', 28000, 36000, 33500, 24],
  ['Hoá phẩm', 'Giấy vệ sinh Pulppy 10 cuộn', 'bịch', '10 cuộn', 52000, 65000, 61000, 15],
  ['Hoá phẩm', 'Xà bông Lifebuoy 90g', 'cái', '90g', 11000, 15000, 13500, 40],
  ['Thực phẩm', 'Trứng gà vỉ 10 quả', 'hộp', '10 quả', 28000, 35000, 33000, 20],
  ['Thực phẩm', 'Xúc xích Vissan 175g', 'gói', '175g', 24000, 31000, 29000, 30],
  ['Thực phẩm', 'Cá hộp 3 Cô Gái 155g', 'lon', '155g', 17000, 23000, 21000, 36],
];
```

- [ ] **Step 5: Create `editions/minimart/index.js`**

```js
import products from './products.js';

export default {
  id: 'minimart',
  name: 'Tạp hoá / Minimart',
  tagline: 'Hàng tiêu dùng nhanh, nhiều mặt hàng, bán lẻ là chính.',
  appTitle: 'PHẦN MỀM BÁN HÀNG TẠP HOÁ - MINIMART',
  seed: 1101,
  codePrefix: 'TH',
  shop: { name: 'Tạp hoá Minh Anh', phone: '0901 234 567', address: '12 Nguyễn Trãi, P.2, Q.5, TP.HCM' },
  units: ['gói', 'chai', 'lon', 'hộp', 'thùng', 'kg', 'cái', 'bịch'],
  products,
  customers: [
    { name: 'Khách lẻ', phone: '', address: '', profile: 'walkin' },
    { name: 'Quán cà phê Gió Chiều', phone: '0903 111 222', address: '45 Trần Hưng Đạo, Q.5', profile: 'regular' },
    { name: 'Chị Lan (bán nước)', phone: '0904 222 333', address: 'Hẻm 18 Nguyễn Trãi', profile: 'regular' },
    { name: 'Chú Bảy xe ôm', phone: '0905 333 444', address: 'Ngã tư Nguyễn Trãi', profile: 'regular' },
    { name: 'Tiệm net Thành Đạt', phone: '0906 444 555', address: '102 An Dương Vương, Q.5', profile: 'regular' },
    { name: 'Anh Tuấn - bảo vệ chung cư', phone: '0907 555 666', address: 'Chung cư Hùng Vương', profile: 'debtor' },
    { name: 'Cô Hoa - tạp hoá đầu hẻm', phone: '0908 666 777', address: 'Hẻm 30 Nguyễn Trãi', profile: 'debtor' },
    { name: 'Bếp ăn công ty An Phát', phone: '028 3838 1234', address: 'KCN Tân Tạo', profile: 'debtor' },
  ],
  suppliers: [
    { name: 'NPP Vinamilk Quận 5', phone: '028 3855 0001', address: '10 Hùng Vương, Q.5' },
    { name: 'Đại lý nước giải khát Hưng Thịnh', phone: '0909 100 200', address: '77 Lê Hồng Phong, Q.10' },
    { name: 'Công ty TNHH Phân phối Masan', phone: '028 3822 0002', address: 'Q.1, TP.HCM' },
    { name: 'Tổng kho hoá phẩm Phú Thọ', phone: '0918 300 400', address: 'Chợ Bình Tây, Q.6' },
  ],
  expenses: [
    ['Chi vận chuyển', 'Phí ship hàng nhập', 30000, 150000],
    ['Điện nước', 'Tiền điện tủ mát', 200000, 600000],
    ['Chi khác', 'Túi ni lông, văn phòng phẩm', 20000, 100000],
  ],
  activity: { invoicesPerDay: [2, 4], maxQty: 6, purchaseQty: [12, 48], walkInRatio: 0.7 },
};
```

- [ ] **Step 6: Create `editions/vlxd/products.js`**

```js
// [group, name, unit, spec, avgCost, sellPriceDefault, sellPriceWholesale, openingStock]
export default [
  ['Thép', 'Thép hộp 20x40 dày 1.2ly', 'cây', '6m', 118000, 140000, 133000, 80],
  ['Thép', 'Thép hộp 40x80 dày 1.4ly', 'cây', '6m', 265000, 310000, 295000, 50],
  ['Thép', 'Thép phi 10 Hoà Phát', 'cây', '11.7m', 98000, 115000, 109000, 120],
  ['Thép', 'Thép phi 16 Hoà Phát', 'cây', '11.7m', 255000, 295000, 282000, 60],
  ['Thép', 'Thép V40x40x4', 'cây', '6m', 215000, 250000, 240000, 40],
  ['Nhôm', 'Nhôm hộp 25x50 Xingfa', 'cây', '5.8m', 210000, 255000, 242000, 40],
  ['Nhôm', 'Nhôm khung cửa hệ 55', 'cây', '5.8m', 320000, 385000, 365000, 30],
  ['Nhôm', 'Nhôm la 3x30', 'cây', '6m', 65000, 82000, 77000, 50],
  ['Kính', 'Kính cường lực 8ly', 'm2', '', 420000, 520000, 490000, 60],
  ['Kính', 'Kính trắng 5ly', 'm2', '', 180000, 230000, 215000, 80],
  ['Kính', 'Gương soi 5ly', 'm2', '', 260000, 330000, 310000, 30],
  ['Xi măng', 'Xi măng Hà Tiên PCB40', 'bao', '50kg', 88000, 98000, 94000, 200],
  ['Xi măng', 'Xi măng INSEE đa dụng', 'bao', '50kg', 92000, 103000, 99000, 150],
  ['Gạch - cát - đá', 'Cát xây tô', 'm3', '', 320000, 400000, 380000, 30],
  ['Gạch - cát - đá', 'Đá 1x2', 'm3', '', 380000, 460000, 440000, 25],
  ['Gạch - cát - đá', 'Gạch ống 8x8x18', 'cái', '', 1200, 1600, 1450, 6000],
  ['Gạch - cát - đá', 'Gạch men 60x60 Đồng Tâm', 'thùng', '4 viên', 210000, 260000, 245000, 60],
  ['Tôn', 'Tôn lạnh màu 0.40ly', 'm2', 'khổ 1.07m', 72000, 88000, 84000, 300],
  ['Tôn', 'Tôn lạnh màu 0.45ly', 'm2', 'khổ 1.07m', 81000, 98000, 93000, 250],
  ['Phụ kiện', 'Que hàn Kim Tín 2.5ly', 'kg', '', 52000, 65000, 61000, 80],
  ['Phụ kiện', 'Đá cắt 355mm', 'cái', '', 38000, 50000, 46000, 60],
  ['Phụ kiện', 'Bản lề cửa inox 4 tấc', 'cái', '', 18000, 25000, 23000, 150],
  ['Phụ kiện', 'Khoá tay gạt Việt Tiệp', 'cái', '', 185000, 230000, 218000, 30],
  ['Phụ kiện', 'Vít bắn tôn 5cm', 'thùng', '1000 con', 145000, 180000, 170000, 30],
  ['Phụ kiện', 'Keo silicon A500', 'cái', '300ml', 38000, 48000, 45000, 80],
  ['Sơn', 'Sơn chống rỉ Đại Bàng 3kg', 'thùng', '3kg', 135000, 165000, 156000, 30],
  ['Sơn', 'Sơn nước Dulux ngoại thất 5L', 'thùng', '5L', 820000, 960000, 920000, 15],
  ['Điện nước', 'Ống nhựa Bình Minh phi 21', 'cây', '4m', 22000, 29000, 27000, 200],
  ['Điện nước', 'Ống nhựa Bình Minh phi 90', 'cây', '4m', 145000, 175000, 166000, 60],
  ['Điện nước', 'Dây điện Cadivi 2.5mm', 'cuộn', '100m', 820000, 950000, 910000, 20],
];
```

- [ ] **Step 7: Create `editions/vlxd/index.js`**

```js
import products from './products.js';

export default {
  id: 'vlxd',
  name: 'Vật liệu xây dựng',
  tagline: 'Sắt thép, nhôm kính, xi măng — bán sỉ cho thầu thợ, công nợ nhiều.',
  appTitle: 'PHẦN MỀM BÁN HÀNG VẬT LIỆU XÂY DỰNG',
  seed: 2202,
  codePrefix: 'VL',
  shop: { name: 'VLXD Phúc Thành', phone: '0912 345 678', address: '245 Quốc lộ 1A, Bình Chánh, TP.HCM' },
  units: ['cây', 'tấm', 'bao', 'kg', 'm2', 'm3', 'cái', 'thùng', 'cuộn'],
  products,
  customers: [
    { name: 'Khách lẻ', phone: '', address: '', profile: 'walkin' },
    { name: 'Chị Mai - chủ nhà Q.7', phone: '0913 111 222', address: 'Phú Mỹ Hưng, Q.7', profile: 'regular' },
    { name: 'Anh Dũng - thợ điện', phone: '0914 222 333', address: 'Bình Hưng, Bình Chánh', profile: 'regular' },
    { name: 'Cửa hàng nhôm kính Tân Phú', phone: '0915 333 444', address: '12 Luỹ Bán Bích, Tân Phú', profile: 'regular' },
    { name: 'Anh Hùng - thầu xây dựng', phone: '0916 444 555', address: 'Tân Kiên, Bình Chánh', profile: 'debtor' },
    { name: 'Công ty TNHH Xây dựng Phúc Thịnh', phone: '028 3756 7890', address: 'KCN Lê Minh Xuân', profile: 'debtor' },
    { name: 'Chú Sáu - thợ hàn', phone: '0917 555 666', address: 'Vĩnh Lộc A, Bình Chánh', profile: 'debtor' },
    { name: 'Anh Khoa - nhôm kính Khoa Phát', phone: '0918 666 777', address: 'An Lạc, Bình Tân', profile: 'debtor' },
  ],
  suppliers: [
    { name: 'Tổng kho thép Hoà Phát Miền Nam', phone: '028 3765 0001', address: 'KCN Phú Mỹ, Bà Rịa' },
    { name: 'Nhà phân phối nhôm Xingfa Sài Gòn', phone: '0919 100 200', address: 'Q.12, TP.HCM' },
    { name: 'Đại lý xi măng Hà Tiên Bình Chánh', phone: '0919 300 400', address: 'Bình Chánh, TP.HCM' },
    { name: 'Công ty kính Việt Nhật', phone: '028 3766 0002', address: 'Thủ Đức, TP.HCM' },
  ],
  expenses: [
    ['Chi vận chuyển', 'Thuê xe tải giao hàng', 300000, 1200000],
    ['Lương - công nhật', 'Công bốc xếp', 200000, 600000],
    ['Điện nước', 'Tiền điện máy cắt', 300000, 900000],
  ],
  activity: { invoicesPerDay: [1, 3], maxQty: 10, purchaseQty: [10, 40], walkInRatio: 0.35 },
};
```

- [ ] **Step 8: Create `editions/fashion/products.js`**

```js
// [group, name, unit, spec, avgCost, sellPriceDefault, sellPriceWholesale, openingStock]
export default [
  ['Áo', 'Áo thun cotton basic trắng', 'cái', 'Size M', 65000, 129000, 110000, 40],
  ['Áo', 'Áo thun cotton basic đen', 'cái', 'Size L', 65000, 129000, 110000, 40],
  ['Áo', 'Áo polo nam Pique xanh navy', 'cái', 'Size L', 115000, 229000, 195000, 30],
  ['Áo', 'Áo sơ mi nam oxford trắng', 'cái', 'Size M', 140000, 289000, 245000, 25],
  ['Áo', 'Áo sơ mi nữ lụa tay dài', 'cái', 'Size S', 135000, 269000, 229000, 25],
  ['Áo', 'Áo khoác gió 2 lớp', 'cái', 'Size L', 190000, 389000, 330000, 20],
  ['Áo', 'Áo hoodie nỉ bông', 'cái', 'Size XL', 170000, 349000, 299000, 20],
  ['Quần', 'Quần jean nam slimfit xanh đậm', 'cái', 'Size 30', 210000, 429000, 365000, 25],
  ['Quần', 'Quần jean nữ ống rộng', 'cái', 'Size 27', 195000, 399000, 340000, 25],
  ['Quần', 'Quần kaki nam màu be', 'cái', 'Size 31', 165000, 329000, 280000, 25],
  ['Quần', 'Quần short kaki nam', 'cái', 'Size 30', 110000, 219000, 186000, 30],
  ['Quần', 'Quần tây nữ công sở', 'cái', 'Size M', 150000, 299000, 255000, 20],
  ['Váy - đầm', 'Đầm suông hoa nhí', 'chiếc', 'Free size', 175000, 359000, 305000, 20],
  ['Váy - đầm', 'Chân váy chữ A đen', 'chiếc', 'Size M', 120000, 249000, 212000, 20],
  ['Váy - đầm', 'Đầm dự tiệc cổ vuông', 'chiếc', 'Size S', 290000, 589000, 500000, 12],
  ['Đồ bộ', 'Đồ bộ mặc nhà cotton', 'bộ', 'Free size', 95000, 189000, 160000, 30],
  ['Đồ bộ', 'Bộ thể thao nam', 'bộ', 'Size L', 180000, 359000, 305000, 15],
  ['Giày', 'Giày sneaker trắng unisex', 'đôi', 'Size 40', 260000, 529000, 450000, 20],
  ['Giày', 'Giày tây nam da bò', 'đôi', 'Size 41', 420000, 850000, 720000, 12],
  ['Giày', 'Giày cao gót nữ 7cm', 'đôi', 'Size 37', 220000, 449000, 380000, 15],
  ['Giày', 'Giày búp bê nữ', 'đôi', 'Size 36', 150000, 299000, 255000, 18],
  ['Dép', 'Dép quai ngang nam', 'đôi', 'Size 42', 55000, 119000, 99000, 40],
  ['Dép', 'Sandal nữ quai mảnh', 'đôi', 'Size 37', 120000, 249000, 212000, 20],
  ['Phụ kiện', 'Thắt lưng da nam', 'cái', '', 130000, 269000, 229000, 20],
  ['Phụ kiện', 'Túi xách nữ đeo chéo', 'cái', '', 210000, 429000, 365000, 15],
  ['Phụ kiện', 'Vớ cổ ngắn (lốc 5 đôi)', 'bộ', '', 35000, 79000, 65000, 50],
  ['Phụ kiện', 'Mũ lưỡi trai thêu chữ', 'cái', '', 60000, 129000, 110000, 25],
  ['Phụ kiện', 'Balo laptop chống nước', 'cái', '', 230000, 469000, 399000, 12],
];
```

- [ ] **Step 9: Create `editions/fashion/index.js`**

```js
import products from './products.js';

export default {
  id: 'fashion',
  name: 'Thời trang / Giày dép',
  tagline: 'Quần áo, giày dép, phụ kiện — bán lẻ tại quầy và bán sỉ cho shop.',
  appTitle: 'PHẦN MỀM BÁN HÀNG THỜI TRANG - GIÀY DÉP',
  seed: 3303,
  codePrefix: 'TT',
  shop: { name: 'Thời trang Mộc Lan', phone: '0938 456 789', address: '88 Lê Văn Sỹ, P.13, Q.3, TP.HCM' },
  units: ['cái', 'đôi', 'bộ', 'chiếc'],
  products,
  customers: [
    { name: 'Khách lẻ', phone: '', address: '', profile: 'walkin' },
    { name: 'Chị Ngọc (khách quen)', phone: '0931 111 222', address: 'Q.3, TP.HCM', profile: 'regular' },
    { name: 'Anh Phong', phone: '0932 222 333', address: 'Q. Phú Nhuận', profile: 'regular' },
    { name: 'Chị Thảo - shop online', phone: '0933 333 444', address: 'Q. Gò Vấp', profile: 'regular' },
    { name: 'Chị Trâm - nhân viên văn phòng', phone: '0934 444 555', address: 'Q.1, TP.HCM', profile: 'regular' },
    { name: 'Shop Hương Giang (lấy sỉ)', phone: '0935 555 666', address: 'Chợ Tân Bình', profile: 'debtor' },
    { name: 'Cửa hàng thời trang Bảo Anh', phone: '0936 666 777', address: 'Biên Hoà, Đồng Nai', profile: 'debtor' },
    { name: 'Chị Vy - đại lý Thủ Đức', phone: '0937 777 888', address: 'TP. Thủ Đức', profile: 'debtor' },
  ],
  suppliers: [
    { name: 'Xưởng may Thành Công', phone: '028 3815 0001', address: 'Q. Tân Phú, TP.HCM' },
    { name: 'Kho giày dép Chợ Lớn', phone: '0939 100 200', address: 'Q.5, TP.HCM' },
    { name: 'Nhà phân phối phụ kiện Kim Phát', phone: '0939 300 400', address: 'Q.10, TP.HCM' },
  ],
  expenses: [
    ['Chi vận chuyển', 'Phí giao hàng COD', 20000, 120000],
    ['Chi marketing', 'Chạy quảng cáo Facebook', 200000, 800000],
    ['Điện nước', 'Tiền điện, nước cửa hàng', 300000, 700000],
  ],
  activity: { invoicesPerDay: [1, 4], maxQty: 3, purchaseQty: [5, 20], walkInRatio: 0.65 },
};
```

- [ ] **Step 10: Create `editions/pharmacy/products.js`**

```js
// [group, name, unit, spec, avgCost, sellPriceDefault, sellPriceWholesale, openingStock]
export default [
  ['Giảm đau - hạ sốt', 'Paracetamol 500mg Stada', 'hộp', '10 vỉ x 10 viên', 38000, 50000, 46000, 40],
  ['Giảm đau - hạ sốt', 'Panadol Extra', 'hộp', '15 vỉ x 12 viên', 165000, 195000, 185000, 20],
  ['Giảm đau - hạ sốt', 'Efferalgan 500mg sủi', 'hộp', '4 vỉ x 4 viên', 52000, 65000, 61000, 25],
  ['Giảm đau - hạ sốt', 'Hapacol 250 trẻ em', 'hộp', '24 gói', 58000, 72000, 68000, 20],
  ['Kháng sinh', 'Amoxicillin 500mg', 'hộp', '10 vỉ x 10 viên', 62000, 80000, 75000, 25],
  ['Kháng sinh', 'Augmentin 625mg', 'hộp', '2 vỉ x 7 viên', 155000, 185000, 176000, 15],
  ['Kháng sinh', 'Cefuroxim 500mg', 'hộp', '2 vỉ x 10 viên', 95000, 120000, 113000, 15],
  ['Tiêu hoá', 'Smecta', 'hộp', '30 gói', 98000, 120000, 114000, 20],
  ['Tiêu hoá', 'Berberin 100mg', 'chai', '100 viên', 9000, 15000, 13000, 40],
  ['Tiêu hoá', 'Men vi sinh Enterogermina', 'hộp', '20 ống', 135000, 165000, 156000, 15],
  ['Tiêu hoá', 'Gaviscon gói', 'hộp', '24 gói', 118000, 145000, 138000, 15],
  ['Hô hấp', 'Siro ho Prospan 100ml', 'chai', '100ml', 72000, 90000, 85000, 20],
  ['Hô hấp', 'Viên ngậm Strepsils', 'hộp', '24 viên', 32000, 42000, 39000, 30],
  ['Hô hấp', 'Thuốc ho Bảo Thanh', 'chai', '125ml', 42000, 55000, 51000, 25],
  ['Vitamin', 'Vitamin C 500mg DHG', 'chai', '100 viên', 38000, 50000, 46000, 30],
  ['Vitamin', 'Berocca sủi', 'tuýp', '10 viên', 75000, 95000, 89000, 20],
  ['Vitamin', 'Canxi Corbiere 10ml', 'hộp', '30 ống', 88000, 110000, 104000, 15],
  ['Vitamin', 'Dầu cá Omega 3', 'chai', '100 viên', 145000, 185000, 174000, 12],
  ['Ngoài da', 'Dầu gió xanh Thiên Thảo', 'chai', '12ml', 18000, 25000, 23000, 40],
  ['Ngoài da', 'Salonpas dán', 'hộp', '20 miếng', 28000, 36000, 34000, 30],
  ['Ngoài da', 'Kem Gentrisone 10g', 'tuýp', '10g', 12000, 18000, 16000, 25],
  ['Ngoài da', 'Povidine 10% 90ml', 'chai', '90ml', 19000, 26000, 24000, 25],
  ['Thiết bị y tế', 'Khẩu trang y tế 4 lớp', 'hộp', '50 cái', 28000, 40000, 36000, 50],
  ['Thiết bị y tế', 'Bông gòn Bạch Tuyết 25g', 'gói', '25g', 8000, 12000, 10500, 40],
  ['Thiết bị y tế', 'Nhiệt kế điện tử Microlife', 'cái', '', 95000, 130000, 120000, 10],
  ['Thiết bị y tế', 'Que thử thai Quickstick', 'cái', '', 12000, 20000, 17000, 30],
  ['Thiết bị y tế', 'Nước muối sinh lý 0.9% 500ml', 'chai', '500ml', 4500, 8000, 7000, 60],
  ['Thiết bị y tế', 'Băng cá nhân Urgo', 'hộp', '100 miếng', 38000, 52000, 48000, 20],
];
```

- [ ] **Step 11: Create `editions/pharmacy/index.js`**

```js
import products from './products.js';

export default {
  id: 'pharmacy',
  name: 'Nhà thuốc',
  tagline: 'Thuốc, vitamin, thiết bị y tế — bán lẻ theo đơn và bán sỉ cho phòng khám.',
  appTitle: 'PHẦN MỀM BÁN HÀNG NHÀ THUỐC',
  seed: 4404,
  codePrefix: 'NT',
  shop: { name: 'Nhà thuốc An Khang Phúc', phone: '0977 567 890', address: '156 Phan Đăng Lưu, P.3, Q. Phú Nhuận, TP.HCM' },
  units: ['hộp', 'vỉ', 'viên', 'chai', 'tuýp', 'gói', 'cái'],
  products,
  customers: [
    { name: 'Khách lẻ', phone: '', address: '', profile: 'walkin' },
    { name: 'Cô Tư (khách quen)', phone: '0971 111 222', address: 'Q. Phú Nhuận', profile: 'regular' },
    { name: 'Anh Bình - huyết áp', phone: '0972 222 333', address: 'Q. Bình Thạnh', profile: 'regular' },
    { name: 'Chị Hạnh - mẹ bỉm', phone: '0973 333 444', address: 'Q.3, TP.HCM', profile: 'regular' },
    { name: 'Ông Năm - tiểu đường', phone: '0974 444 555', address: 'Q. Phú Nhuận', profile: 'regular' },
    { name: 'Phòng khám Đa khoa An Tâm', phone: '028 3995 1234', address: 'Q. Tân Bình', profile: 'debtor' },
    { name: 'Nhà thuốc Minh Châu (lấy sỉ)', phone: '0975 555 666', address: 'Q. Gò Vấp', profile: 'debtor' },
    { name: 'Trạm y tế phường 4', phone: '028 3995 5678', address: 'Q. Phú Nhuận', profile: 'debtor' },
  ],
  suppliers: [
    { name: 'Công ty Dược Hậu Giang - CN HCM', phone: '028 3990 0001', address: 'Q.10, TP.HCM' },
    { name: 'Phân phối Zuellig Pharma', phone: '028 3990 0002', address: 'Q.7, TP.HCM' },
    { name: 'Tổng kho dược phẩm Hapu', phone: '0976 100 200', address: 'Q. Tân Bình' },
  ],
  expenses: [
    ['Chi vận chuyển', 'Phí giao thuốc', 20000, 80000],
    ['Điện nước', 'Tiền điện tủ bảo quản', 150000, 400000],
    ['Chi khác', 'Túi, nhãn thuốc', 30000, 120000],
  ],
  activity: { invoicesPerDay: [2, 4], maxQty: 3, purchaseQty: [5, 20], walkInRatio: 0.75 },
};
```

- [ ] **Step 12: Run to verify it passes**

Run: `cd banhang && npx vitest run src/demo/__tests__/editions.test.js`
Expected: PASS (13 tests)

- [ ] **Step 13: Commit**

```bash
git add banhang/src/demo/editions banhang/src/demo/__tests__/editions.test.js
git commit -m "feat(demo): add sample data for four retail editions"
```

---

### Task 9: Seeding engine and contract test

**Files:**
- Create: `banhang/src/demo/seed/random.js`, `timeline.js`, `stockTracker.js`, `buildMasterData.js`, `transactionFactories.js`, `buildTransactions.js`, `seedApi.js`, `replayTransactions.js`, `seedEdition.js`
- Test: `banhang/src/demo/__tests__/seedContract.test.js`

- [ ] **Step 1: Write the failing contract test**

```js
import { beforeAll, describe, expect, it } from 'vitest';
import { dispatch } from '../demoApp.js';
import { configureStorage, setActiveNamespace } from '../db/localStore.js';
import { EDITIONS } from '../editions/index.js';
import { seedEdition } from '../seed/seedEdition.js';
import { createMemoryStorage } from './helpers/memoryStorage.js';

const get = async (path) => {
  const { status, data } = await dispatch({ path: `/api${path}` });
  expect(status, `${path} -> ${data?.message}`).toBe(200);
  return data;
};

const sumBy = (list, pick) => list.reduce((sum, item) => sum + pick(item), 0);

describe.each(EDITIONS)('seeded edition $id', (edition) => {
  beforeAll(async () => {
    configureStorage(createMemoryStorage());
    setActiveNamespace(edition.id);
    await seedEdition(edition.id, { dispatch });
  }, 30000);

  it('creates master data and a month of transactions', async () => {
    expect(await get('/products')).toHaveLength(edition.products.length);
    expect(await get('/customers')).toHaveLength(edition.customers.length);
    expect((await get('/invoices')).length).toBeGreaterThanOrEqual(25);
    expect((await get('/purchases')).length).toBeGreaterThanOrEqual(8);
    expect((await get('/settings/main')).dataVersion).toBe(2);
  });

  it('keeps stock consistent with purchases and sales', async () => {
    const [products, invoices] = [await get('/products'), await get('/invoices')];
    products.forEach((product) => {
      const sold = sumBy(
        invoices.flatMap((invoice) => invoice.items),
        (item) => (item.productId === product.id ? item.qty : 0)
      );
      expect(product.stock).toBeGreaterThanOrEqual(0);
      expect(product.stock).toBe(product.openingStock - sold);
    });
  });

  it('keeps customer debt consistent with invoices and payments', async () => {
    const [customers, invoices, payments] = [
      await get('/customers'), await get('/invoices'), await get('/payments'),
    ];
    customers.forEach((customer) => {
      const billed = sumBy(invoices, (inv) => (inv.customerId === customer.id ? inv.total : 0));
      const paid = sumBy(payments, (p) => (p.customerId === customer.id ? p.amount : 0));
      expect(customer.currentDebt).toBe(billed - paid);
    });
    expect(customers.some((customer) => customer.currentDebt > 0)).toBe(true);
  });

  it('serves dashboard and reports', async () => {
    await get('/dashboard/today');
    await get('/reports/stock');
    await get('/reports/debt');
    await get('/reports/profit');
    await get('/reports/cash');
    await get('/purchases-tools/recent?limit=20');
    await get('/sales/products?limit=10');
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `cd banhang && npx vitest run src/demo/__tests__/seedContract.test.js`
Expected: FAIL — cannot resolve `../seed/seedEdition.js`.

- [ ] **Step 3: Implement `seed/random.js`**

```js
// Deterministic PRNG (mulberry32) so every visitor gets the same shaped sample data.
export const createRandom = (seed) => {
  let state = seed >>> 0;
  const next = () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
  const int = (min, max) => min + Math.floor(next() * (max - min + 1));
  return {
    next,
    int,
    pick: (list) => list[int(0, list.length - 1)],
    chance: (probability) => next() < probability,
  };
};
```

- [ ] **Step 4: Implement `seed/timeline.js`**

```js
const OPEN_HOUR = 8;
const CLOSE_HOUR = 20;

const atHour = (day, hour) => {
  const date = new Date(day);
  date.setHours(hour, 0, 0, 0);
  return date;
};

// Business days from oldest to today. Today's window ends at `now` so nothing is in the future.
export const listSeedDays = (now, days) =>
  Array.from({ length: days }, (_, index) => {
    const day = new Date(now);
    day.setDate(day.getDate() - (days - 1 - index));
    const isToday = index === days - 1;
    let start = atHour(day, OPEN_HOUR);
    const close = atHour(day, CLOSE_HOUR);
    const end = isToday && now < close ? now : close;
    if (end <= start) start = atHour(day, 0);
    return { offset: days - 1 - index, start, end };
  });

// n ascending timestamps inside a day window, keeping generation order = time order.
export const spreadTimes = ({ start, end }, count, random) =>
  Array.from({ length: count }, () =>
    new Date(start.getTime() + random.next() * (end.getTime() - start.getTime()))
  ).sort((left, right) => left - right);
```

- [ ] **Step 5: Implement `seed/stockTracker.js`**

```js
// Tracks stock while generating sales so the backend never rejects an invoice.
export const createStockTracker = (products) => {
  const levels = new Map(products.map((product) => [product.id, Number(product.openingStock || 0)]));
  return {
    available: (productId) => levels.get(productId) || 0,
    add: (productId, qty) => levels.set(productId, (levels.get(productId) || 0) + qty),
    take: (productId, qty) => levels.set(productId, (levels.get(productId) || 0) - qty),
    inStock: () => products.filter((product) => (levels.get(product.id) || 0) > 0),
  };
};
```

- [ ] **Step 6: Implement `seed/buildMasterData.js`**

```js
import { SNAPSHOT_DATA_VERSION } from '@backend/utils/snapshotStatus.js';
import { v4 as uuid } from 'uuid';
import { DEMO_SYSTEM_PASSWORD, SEED_DAYS } from '../config.js';

const DAY_MS = 24 * 60 * 60 * 1000;

const buildSettings = (edition, createdAt) => ({
  id: 'main',
  shopName: edition.shop.name,
  shopPhone: edition.shop.phone,
  shopAddress: edition.shop.address,
  allowNegativeStock: false,
  autoUpdateAvgCostOnPurchase: true,
  showSensitiveInfo: false,
  lowStockThreshold: 5,
  printCopies: 1,
  invoiceTemplateHtml: '',
  systemPassword: DEMO_SYSTEM_PASSWORD,
  dataVersion: SNAPSHOT_DATA_VERSION,
  stockDebtSnapshotAt: createdAt,
});

const toProduct = (createdAt, prefix) => (row, index) => {
  const [group, name, unit, spec, avgCost, sellPriceDefault, sellPriceWholesale, openingStock] = row;
  return {
    id: uuid(),
    code: `${prefix}${String(index + 1).padStart(3, '0')}`,
    group, name, unit, spec, avgCost, sellPriceDefault, sellPriceWholesale, openingStock,
    excludeFromProfit: false,
    note: '',
    createdAt,
  };
};

// Documents for the bulk endpoints plus lookup tables used by the transaction generator.
export const buildMasterData = (edition, now) => {
  const createdAt = new Date(now.getTime() - (SEED_DAYS + 1) * DAY_MS).toISOString();
  const customers = edition.customers.map((customer) => ({ id: uuid(), ...customer }));
  const idsWhere = (test) => customers.filter(test).map((customer) => customer.id);

  return {
    settings: buildSettings(edition, createdAt),
    units: edition.units.map((name) => ({ id: uuid(), name, note: '', createdAt })),
    products: edition.products.map(toProduct(createdAt, edition.codePrefix)),
    customers: customers.map(({ profile: _profile, ...customer }) => customer),
    suppliers: edition.suppliers.map((supplier) => ({ id: uuid(), ...supplier })),
    profileById: Object.fromEntries(customers.map((c) => [c.id, c.profile])),
    walkInCustomerId: idsWhere((c) => c.profile === 'walkin')[0],
    accountCustomerIds: idsWhere((c) => c.profile !== 'walkin'),
    debtorIds: idsWhere((c) => c.profile === 'debtor'),
  };
};
```

- [ ] **Step 7: Implement `seed/transactionFactories.js`**

```js
const PRICE_STEP = 100;
const MONEY_STEP = 1000;
const PAID_RATIOS = { walkin: [1], regular: [1, 1, 0.5], debtor: [0, 0.5, 1] };
const METHODS = ['cash', 'cash', 'bank'];

export const roundPrice = (value) => Math.max(PRICE_STEP, Math.round(value / PRICE_STEP) * PRICE_STEP);

export const roundMoney = (value) => Math.round(value / MONEY_STEP) * MONEY_STEP;

// Full payment stays exact; partial payments round to 1.000đ and never exceed the total.
export const paidAmount = (total, ratio) =>
  ratio >= 1 ? total : Math.min(total, roundMoney(total * ratio));

const pickDistinct = (random, list, count) => {
  const pool = [...list];
  const picked = [];
  while (pool.length && picked.length < count) {
    picked.push(pool.splice(random.int(0, pool.length - 1), 1)[0]);
  }
  return picked;
};

export const makePurchase = ({ edition, master, random, stock }) => {
  const [minQty, maxQty] = edition.activity.purchaseQty;
  const items = pickDistinct(random, master.products, random.int(3, 5)).map((product) => {
    const qty = random.int(minQty, maxQty);
    stock.add(product.id, qty);
    return { productId: product.id, qty, unitCost: roundPrice(product.avgCost * (0.95 + random.next() * 0.1)) };
  });
  return {
    kind: 'purchase',
    supplierId: random.pick(master.suppliers).id,
    items,
    paidRatio: random.pick([1, 1, 0.5]),
    method: random.pick(METHODS),
  };
};

export const makeInvoice = ({ edition, master, random, stock }) => {
  const candidates = stock.inStock();
  if (!candidates.length) return null;
  const walkIn = !master.accountCustomerIds.length || random.chance(edition.activity.walkInRatio);
  const customerId = walkIn ? master.walkInCustomerId : random.pick(master.accountCustomerIds);
  const profile = master.profileById[customerId];
  const items = pickDistinct(random, candidates, random.int(1, 4)).map((product) => {
    const qty = Math.min(stock.available(product.id), random.int(1, edition.activity.maxQty));
    stock.take(product.id, qty);
    const wholesale = profile !== 'walkin' && random.chance(0.5);
    return { productId: product.id, qty, priceType: wholesale ? 'wholesale' : 'retail' };
  });
  return { kind: 'invoice', customerId, items, paidRatio: random.pick(PAID_RATIOS[profile]), method: random.pick(METHODS) };
};

export const makeDebtReceipt = ({ random }, customerId) => ({
  kind: 'debtReceipt',
  customerId,
  ratio: random.pick([0.3, 0.5, 1]),
  method: random.pick(METHODS),
});

export const makeExpense = ({ edition, random }) => {
  const [category, note, min, max] = random.pick(edition.expenses);
  return { kind: 'expense', category, note, amount: roundMoney(random.int(min, max)) };
};
```

- [ ] **Step 8: Implement `seed/buildTransactions.js`**

```js
import { SEED_DAYS } from '../config.js';
import { createStockTracker } from './stockTracker.js';
import { listSeedDays, spreadTimes } from './timeline.js';
import { makeDebtReceipt, makeExpense, makeInvoice, makePurchase } from './transactionFactories.js';

const PURCHASE_EVERY_DAYS = 3;
const DEBT_RECEIPT_EVERY_DAYS = 7;
const EXPENSE_EVERY_DAYS = 5;

const buildDayEvents = (context, offset) => {
  const { edition, master, random } = context;
  const events = [];
  if (offset % PURCHASE_EVERY_DAYS === 0) events.push(makePurchase(context));
  const invoiceCount = random.int(...edition.activity.invoicesPerDay);
  for (let index = 0; index < invoiceCount; index += 1) {
    const invoice = makeInvoice(context);
    if (invoice) events.push(invoice);
  }
  if (offset % DEBT_RECEIPT_EVERY_DAYS === 0) {
    master.debtorIds
      .filter(() => random.chance(0.5))
      .forEach((customerId) => events.push(makeDebtReceipt(context, customerId)));
  }
  if (offset % EXPENSE_EVERY_DAYS === 0) events.push(makeExpense(context));
  return events;
};

// Chronological list of business events covering the last SEED_DAYS days.
export const buildTransactions = ({ edition, master, now, random }) => {
  const context = { edition, master, random, stock: createStockTracker(master.products) };
  return listSeedDays(now, SEED_DAYS).flatMap((day) => {
    const events = buildDayEvents(context, day.offset);
    const times = spreadTimes(day, events.length, random);
    return events.map((event, index) => ({ ...event, date: times[index].toISOString() }));
  });
};
```

- [ ] **Step 9: Implement `seed/seedApi.js`**

```js
// Thin client over dispatch() that fails loudly; used only while seeding.
export const createSeedApi = (dispatch) => {
  const call = async (method, path, body) => {
    const { status, data } = await dispatch({ method, path: `/api${path}`, body });
    if (status >= 400) {
      throw new Error(`Seed ${method} ${path} thất bại: ${data?.message || status}`);
    }
    return data;
  };
  return {
    get: (path) => call('GET', path),
    post: (path, body) => call('POST', path, body),
    put: (path, body) => call('PUT', path, body),
  };
};
```

- [ ] **Step 10: Implement `seed/replayTransactions.js`**

```js
import dayjs from 'dayjs';
import { v4 as uuid } from 'uuid';
import { computePaymentStatus } from '../../features/sales/domain/salesDomain.js';
import { paidAmount } from './transactionFactories.js';

const createCodeFactory = () => {
  let sequence = 0;
  return (prefix, date) => {
    sequence += 1;
    return `${prefix}-${dayjs(date).format('YYYYMMDD')}-${String(sequence).padStart(3, '0')}`;
  };
};

const sumLines = (items) => items.reduce((sum, item) => sum + item.lineTotal, 0);

const replayPurchase = async (event, { api, nextCode }) => {
  const items = event.items.map((item) => ({ ...item, lineTotal: item.qty * item.unitCost }));
  const { purchase } = await api.post('/purchases-tools', {
    code: nextCode('PO', event.date), supplierId: event.supplierId, date: event.date, items, note: '',
  });
  const amount = paidAmount(purchase.total, event.paidRatio);
  if (amount <= 0) return;
  await api.post('/payments', {
    id: uuid(), purchaseId: purchase.id, supplierId: event.supplierId, paymentType: 'purchase_payment',
    date: event.date, method: event.method, amount, note: '',
  });
};

// Mirrors the sales screen: invoice first (cost snapshot from current avgCost), then its payment.
const replayInvoice = async (event, { api, nextCode }) => {
  const productById = new Map((await api.get('/products')).map((product) => [product.id, product]));
  const items = event.items.map(({ productId, qty, priceType }) => {
    const product = productById.get(productId);
    const unitPrice = priceType === 'wholesale' ? product.sellPriceWholesale : product.sellPriceDefault;
    return {
      productId, qty, unitPrice, lineTotal: qty * unitPrice, lineNote: '',
      costPriceSnapshot: Number(product.avgCost || 0),
      excludeFromProfitSnapshot: Boolean(product.excludeFromProfit),
    };
  });
  const total = sumLines(items);
  const paid = paidAmount(total, event.paidRatio);
  const invoice = await api.post('/invoices', {
    id: uuid(), code: nextCode('INV', event.date), customerId: event.customerId, date: event.date,
    items, subTotal: total, discountTotal: 0, total, note: '',
    paymentStatus: computePaymentStatus(total, paid),
    changeLog: [{ date: event.date, note: 'Tạo hóa đơn' }],
  });
  if (paid <= 0) return;
  await api.post('/payments', {
    id: uuid(), invoiceId: invoice.id, customerId: event.customerId, paymentType: 'invoice_payment',
    date: event.date, method: event.method, amount: paid, note: '',
  });
};

const replayDebtReceipt = async (event, { api, nextCode }) => {
  const customer = await api.get(`/customers/${event.customerId}`);
  const amount = paidAmount(Number(customer?.currentDebt || 0), event.ratio);
  if (amount <= 0) return;
  await api.post('/payments', {
    id: uuid(), code: nextCode('PTN', event.date), customerId: event.customerId,
    paymentType: 'debt_receipt', date: event.date, method: event.method, amount, note: 'Thu nợ',
  });
};

const replayExpense = (event, { api }) =>
  api.post('/cashbook', {
    id: uuid(), date: event.date, type: 'out', amount: event.amount,
    category: event.category, note: event.note,
  });

const REPLAYERS = {
  purchase: replayPurchase,
  invoice: replayInvoice,
  debtReceipt: replayDebtReceipt,
  expense: replayExpense,
};

// Sends events through the real endpoints in order, so backend code computes stock/debt/cost.
export const replayTransactions = async (events, api) => {
  const context = { api, nextCode: createCodeFactory() };
  for (const event of events) {
    await REPLAYERS[event.kind](event, context);
  }
};
```

- [ ] **Step 11: Implement `seed/seedEdition.js`**

```js
import { clearNamespace, getActiveNamespace } from '../db/localStore.js';
import { getEdition } from '../editions/index.js';
import { buildMasterData } from './buildMasterData.js';
import { buildTransactions } from './buildTransactions.js';
import { createRandom } from './random.js';
import { replayTransactions } from './replayTransactions.js';
import { createSeedApi } from './seedApi.js';

// Wipes the edition's data and rebuilds it through the real API. Caller activates the namespace.
export const seedEdition = async (editionId, { dispatch, now = new Date() }) => {
  const edition = getEdition(editionId);
  if (!edition) throw new Error(`Không tìm thấy ngành hàng ${editionId}.`);
  if (getActiveNamespace() !== editionId) {
    throw new Error(`seedEdition: namespace đang là ${getActiveNamespace()}, cần ${editionId}.`);
  }

  clearNamespace(editionId);
  const api = createSeedApi(dispatch);
  const master = buildMasterData(edition, now);
  await api.put('/settings/main', master.settings);
  await api.post('/units/bulk', master.units);
  await api.post('/products/bulk', master.products);
  await api.post('/customers/bulk', master.customers);
  await api.post('/suppliers/bulk', master.suppliers);

  const events = buildTransactions({ edition, master, now, random: createRandom(edition.seed) });
  await replayTransactions(events, api);
};
```

- [ ] **Step 12: Run to verify it passes**

Run: `cd banhang && npx vitest run src/demo/__tests__/seedContract.test.js`
Expected: PASS (16 tests). If an assertion on stock/debt fails, the bug is in the shim (DemoModel/applyUpdate) or the generator, not in the backend — the backend is the reference.

- [ ] **Step 13: Commit**

```bash
git add banhang/src/demo/seed banhang/src/demo/__tests__/seedContract.test.js
git commit -m "feat(demo): seed editions by replaying transactions through the real api"
```

---

### Task 10: Demo session lifecycle

**Files:**
- Create: `banhang/src/demo/session/demoSession.js`
- Test: `banhang/src/demo/__tests__/demoSession.test.js`

- [ ] **Step 1: Write the failing test**

```js
import { beforeEach, describe, expect, it } from 'vitest';
import { META_KEY } from '../config.js';
import { configureStorage, readCollection } from '../db/localStore.js';
import { activateEdition, bootDemoSession, DEMO_NOTICES, resetEdition } from '../session/demoSession.js';
import { createMemoryStorage } from './helpers/memoryStorage.js';

describe('demo session', () => {
  let storage;

  beforeEach(() => {
    storage = createMemoryStorage();
    configureStorage(storage);
  });

  it('asks for an edition on first visit, then resumes it', async () => {
    expect(await bootDemoSession()).toEqual({ status: 'picking', notices: [] });
    const edition = await activateEdition('vlxd');
    expect(edition.id).toBe('vlxd');
    configureStorage(storage);
    const resumed = await bootDemoSession();
    expect(resumed).toMatchObject({ status: 'ready', notices: [] });
    expect(resumed.edition.id).toBe('vlxd');
    expect(readCollection('product').length).toBe(edition.products.length);
  }, 30000);

  it('wipes data from an older schema version', async () => {
    storage.setItem(META_KEY, JSON.stringify({ schemaVersion: 0, activeEdition: 'vlxd', editions: {} }));
    storage.setItem('bh-demo:v0:vlxd:product', '[]');
    const result = await bootDemoSession();
    expect(result).toEqual({ status: 'picking', notices: [DEMO_NOTICES.schemaReset] });
    expect(storage.getItem('bh-demo:v0:vlxd:product')).toBeNull();
  });

  it('reseeds corrupt data and supports manual reset', async () => {
    await activateEdition('minimart');
    storage.setItem('bh-demo:v1:minimart:invoice', '{broken');
    configureStorage(storage);
    const result = await bootDemoSession();
    expect(result.notices).toEqual([DEMO_NOTICES.corruptReset]);
    expect(readCollection('invoice').length).toBeGreaterThan(0);
    await resetEdition('minimart');
    expect(readCollection('invoice').length).toBeGreaterThan(0);
  }, 30000);

  it('reports blocked storage', async () => {
    configureStorage(null);
    expect(await bootDemoSession()).toEqual({ status: 'blocked' });
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `cd banhang && npx vitest run src/demo/__tests__/demoSession.test.js`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement `session/demoSession.js`**

```js
import { dispatch } from '../demoApp.js';
import { findCorruptCollections, isStorageAvailable, setActiveNamespace } from '../db/localStore.js';
import { getEdition } from '../editions/index.js';
import { seedEdition } from '../seed/seedEdition.js';
import { ensureSchemaVersion, isEditionSeeded, markEditionSeeded, readMeta, setActiveEdition } from './demoMeta.js';

export const DEMO_NOTICES = {
  schemaReset: 'Bản demo vừa được cập nhật, dữ liệu mẫu đã được làm mới.',
  corruptReset: 'Dữ liệu demo bị lỗi nên đã được tạo lại từ dữ liệu mẫu.',
};

const requireEdition = (editionId) => {
  const edition = getEdition(editionId);
  if (!edition) throw new Error(`Không tìm thấy ngành hàng ${editionId}.`);
  return edition;
};

export const resetEdition = async (editionId) => {
  requireEdition(editionId);
  setActiveNamespace(editionId);
  await seedEdition(editionId, { dispatch });
  markEditionSeeded(editionId);
};

// Decides what the UI shows first: blocked, edition picker, or the app.
export const bootDemoSession = async () => {
  if (!isStorageAvailable()) return { status: 'blocked' };
  const notices = [];
  if (ensureSchemaVersion()) notices.push(DEMO_NOTICES.schemaReset);

  const edition = getEdition(readMeta().activeEdition);
  if (!edition) return { status: 'picking', notices };

  const corrupt = findCorruptCollections(edition.id).length > 0;
  if (corrupt) notices.push(DEMO_NOTICES.corruptReset);
  if (corrupt || !isEditionSeeded(edition.id)) {
    await resetEdition(edition.id);
  } else {
    setActiveNamespace(edition.id);
  }
  return { status: 'ready', edition, notices };
};

// Switches to an edition, seeding it the first time. Data of other editions is kept.
export const activateEdition = async (editionId) => {
  const edition = requireEdition(editionId);
  if (isEditionSeeded(editionId)) {
    setActiveNamespace(editionId);
  } else {
    await resetEdition(editionId);
  }
  setActiveEdition(editionId);
  return edition;
};
```

- [ ] **Step 4: Run to verify it passes**

Run: `cd banhang && npx vitest run src/demo/__tests__/demoSession.test.js`
Expected: PASS (4 tests)

- [ ] **Step 5: Commit**

```bash
git add banhang/src/demo/session/demoSession.js banhang/src/demo/__tests__/demoSession.test.js
git commit -m "feat(demo): add session boot, edition switching and reset"
```

---

### Task 11: Frontend transport switch

**Files:**
- Create: `banhang/src/db/transport.js`
- Modify: `banhang/src/db/repository.js:1-43`, `banhang/src/pages/Catalog/openingImportApi.js`
- Test: `banhang/src/db/__tests__/transport.test.js`

- [ ] **Step 1: Write the failing test**

```js
import { afterEach, describe, expect, it, vi } from 'vitest';
import { apiRequest } from '../repository.js';
import { API_BASE, sendRequest } from '../transport.js';

const stubFetch = (status, body) => {
  const fetchMock = vi.fn().mockResolvedValue({
    ok: status < 400, status, text: async () => (body === undefined ? '' : JSON.stringify(body)),
  });
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
};

describe('transport', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('sends JSON over fetch', async () => {
    const fetchMock = stubFetch(200, { ok: 1 });
    const result = await sendRequest('/x', { method: 'POST', body: { a: 1 } });
    expect(result).toMatchObject({ ok: true, status: 200, data: { ok: 1 } });
    expect(fetchMock).toHaveBeenCalledWith(`${API_BASE}/x`, expect.objectContaining({
      method: 'POST', body: '{"a":1}',
    }));
  });

  it('keeps apiRequest semantics: 404 -> null, errors throw message', async () => {
    stubFetch(404, { message: 'Not found' });
    expect(await apiRequest('/missing')).toBeNull();
    stubFetch(400, { message: 'Trùng sản phẩm' });
    await expect(apiRequest('/products', { method: 'POST', body: {} })).rejects.toThrow('Trùng sản phẩm');
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `cd banhang && npx vitest run src/db/__tests__/transport.test.js`
Expected: FAIL — `../transport.js` not found.

- [ ] **Step 3: Create `src/db/transport.js`**

```js
export const API_BASE =
  import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const parseBody = (text) => {
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
};

const encodeBody = (body) =>
  body === undefined || typeof body === 'string' ? body : JSON.stringify(body);

const httpTransport = async (path, { headers, body, ...options } = {}) => {
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...(headers || {}) },
    body: encodeBody(body),
  });
  const text = await response.text();
  return { ok: response.ok, status: response.status, data: parseBody(text), text };
};

// Demo builds answer requests in the browser (src/demo); the module is never bundled otherwise.
const demoTransport = async (path, { method = 'GET', body } = {}) => {
  const { dispatch } = await import('../demo/demoApp.js');
  const payload = typeof body === 'string' ? parseBody(body) : body;
  const { status, data } = await dispatch({ method, path: `/api${path}`, body: payload });
  const text = data == null ? '' : JSON.stringify(data);
  return { ok: status >= 200 && status < 300, status, data, text };
};

export const sendRequest = __DEMO__ ? demoTransport : httpTransport;
```

- [ ] **Step 4: Update `repository.js`** — replace lines 1–43 (from `export const API_BASE` through the end of `apiRequest`) with:

```js
import { sendRequest } from './transport.js';

export { API_BASE } from './transport.js';

const stripMeta = (payload) => {
  if (!payload || typeof payload !== 'object') return payload;
  const { _id, __v, ...rest } = payload;
  return rest;
};

export const apiRequest = async (path, options = {}) => {
  const { ok, status, data, text } = await sendRequest(path, options);

  if (!ok) {
    if (status === 404) return null;
    const message = (data && data.message) || text || 'Request failed';
    throw new Error(message);
  }

  return data;
};
```

- [ ] **Step 5: Replace `openingImportApi.js`**

```js
import { sendRequest } from '../../db/transport.js';

const requestOpeningImport = async (path, body) => {
  const { ok, data, text } = await sendRequest(path, {
    method: 'POST',
    body: body || {},
  });

  if (!ok) {
    const error = new Error(
      (data && data.message) || text || 'Yêu cầu import thất bại.'
    );
    error.details = data;
    throw error;
  }

  return data;
};

export const previewOpeningImport = (payload) =>
  requestOpeningImport('/opening-import/preview', payload);

export const commitOpeningImport = (payload) =>
  requestOpeningImport('/opening-import/commit', payload);
```

- [ ] **Step 6: Run the full FE suite**

Run: `cd banhang && VITE_API_URL= npx vitest run`
Expected: all tests pass (including the two baseline tests, because the `.env` override is blanked).

- [ ] **Step 7: Commit**

```bash
git add banhang/src/db banhang/src/pages/Catalog/openingImportApi.js
git commit -m "refactor(frontend): route api calls through a swappable transport"
```

---

### Task 12: Demo UI and app entry

**Files:**
- Create: `banhang/src/constants/app.js`
- Create: `banhang/src/demo/mountDemo.jsx`, `banhang/src/demo/ui/{DemoGate.jsx,EditionGrid.jsx,EditionPicker.jsx,DemoBanner.jsx,useDemoSession.js,useDemoActions.js,demo.css}`
- Modify: `banhang/src/App.jsx`, `banhang/src/main.jsx`

- [ ] **Step 1: Create `src/constants/app.js`**

```js
export const DEFAULT_APP_TITLE = 'PHẦN MỀM BÁN HÀNG NHÔM KÍNH/SẮT';
```

- [ ] **Step 2: Update `App.jsx`** — add `import { DEFAULT_APP_TITLE } from './constants/app.js';`, change the signature to `const App = ({ title = DEFAULT_APP_TITLE }) => {` and the header to `<div className="app-title">{title}</div>`.

- [ ] **Step 3: Update `main.jsx`** — replace everything from `ReactDOM.createRoot(` to the end with:

```jsx
const renderApp = (wrap = (node) => node) => {
  ReactDOM.createRoot(document.getElementById('root')).render(
    <ConfigProvider locale={viVN}>
      <Router>{wrap(<App />)}</Router>
    </ConfigProvider>
  );
};

if (__DEMO__) {
  import('./demo/mountDemo.jsx').then(({ wrapWithDemo }) =>
    renderApp(wrapWithDemo)
  );
} else {
  renderApp();
}

if (
  import.meta.env.PROD &&
  !__DEMO__ &&
  'serviceWorker' in navigator &&
  !isElectron
) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch((error) => {
      console.error('Service worker registration failed:', error);
    });
  });
}
```

- [ ] **Step 4: Create `ui/useDemoSession.js`**

```js
import { useCallback, useEffect, useReducer } from 'react';
import { activateEdition, bootDemoSession } from '../session/demoSession.js';

const initialState = { status: 'booting', edition: null, notices: [], error: '' };

const reducer = (state, action) => {
  switch (action.type) {
    case 'booted':
      return { ...state, ...action.result };
    case 'seeding':
      return { ...state, status: 'seeding' };
    case 'ready':
      return { ...state, status: 'ready', edition: action.edition };
    case 'failed':
      return { ...state, status: 'error', error: action.error };
    default:
      return state;
  }
};

export const useDemoSession = () => {
  const [state, dispatch] = useReducer(reducer, initialState);

  useEffect(() => {
    let active = true;
    bootDemoSession()
      .then((result) => active && dispatch({ type: 'booted', result }))
      .catch((error) => active && dispatch({ type: 'failed', error: error.message }));
    return () => {
      active = false;
    };
  }, []);

  const chooseEdition = useCallback(async (editionId) => {
    dispatch({ type: 'seeding' });
    try {
      dispatch({ type: 'ready', edition: await activateEdition(editionId) });
    } catch (error) {
      dispatch({ type: 'failed', error: error.message });
    }
  }, []);

  return { state, chooseEdition };
};
```

- [ ] **Step 5: Create `ui/useDemoActions.js`**

```js
import { message, Modal } from 'antd';
import { useCallback, useState } from 'react';
import { activateEdition, resetEdition } from '../session/demoSession.js';

// Edition switch/reset change every store's data, so the page reloads afterwards.
export const useDemoActions = (edition) => {
  const [busy, setBusy] = useState(false);

  const run = useCallback(async (task) => {
    setBusy(true);
    try {
      await task();
      window.location.reload();
    } catch (error) {
      message.error(error.message);
      setBusy(false);
    }
  }, []);

  const switchTo = useCallback((editionId) => run(() => activateEdition(editionId)), [run]);

  const restore = useCallback(() => {
    Modal.confirm({
      title: 'Khôi phục dữ liệu mẫu?',
      content: `Toàn bộ dữ liệu đã nhập cho "${edition.name}" sẽ bị xoá và thay bằng dữ liệu mẫu.`,
      okText: 'Khôi phục',
      okButtonProps: { danger: true },
      cancelText: 'Huỷ',
      onOk: () => run(() => resetEdition(edition.id)),
    });
  }, [edition, run]);

  return { busy, switchTo, restore };
};
```

- [ ] **Step 6: Create `ui/EditionGrid.jsx`**

```jsx
import { Card, Col, Row, Tag, Typography } from 'antd';
import { EDITIONS } from '../editions/index.js';

const onEnter = (callback) => (event) => {
  if (event.key === 'Enter' || event.key === ' ') callback();
};

const EditionGrid = ({ activeId, onPick }) => (
  <Row gutter={[16, 16]}>
    {EDITIONS.map((edition) => (
      <Col xs={24} sm={12} key={edition.id}>
        <Card
          hoverable
          role="button"
          tabIndex={0}
          className="demo-edition-card"
          onClick={() => onPick(edition.id)}
          onKeyDown={onEnter(() => onPick(edition.id))}
        >
          <Typography.Title level={4}>
            {edition.name} {edition.id === activeId && <Tag color="blue">Đang dùng</Tag>}
          </Typography.Title>
          <Typography.Text type="secondary">{edition.tagline}</Typography.Text>
        </Card>
      </Col>
    ))}
  </Row>
);

export default EditionGrid;
```

- [ ] **Step 7: Create `ui/EditionPicker.jsx`**

```jsx
import { Alert, Typography } from 'antd';
import EditionGrid from './EditionGrid.jsx';

const EditionPicker = ({ notices = [], onPick }) => (
  <main className="demo-picker">
    <Typography.Title level={2}>Chọn loại cửa hàng để dùng thử</Typography.Title>
    <Typography.Paragraph type="secondary">
      Dữ liệu mẫu được tạo sẵn và chỉ lưu trên trình duyệt này. Bạn có thể đổi
      loại cửa hàng bất cứ lúc nào.
    </Typography.Paragraph>
    {notices.map((notice) => (
      <Alert key={notice} type="info" showIcon message={notice} className="demo-notice" />
    ))}
    <EditionGrid onPick={onPick} />
  </main>
);

export default EditionPicker;
```

- [ ] **Step 8: Create `ui/DemoBanner.jsx`**

```jsx
import { Alert, Button, Modal, Space, Spin } from 'antd';
import { useState } from 'react';
import { CONTACT_URL, DEMO_SYSTEM_PASSWORD } from '../config.js';
import EditionGrid from './EditionGrid.jsx';
import { useDemoActions } from './useDemoActions.js';

const DemoBanner = ({ edition, notices = [] }) => {
  const [pickerOpen, setPickerOpen] = useState(false);
  const { busy, switchTo, restore } = useDemoActions(edition);

  const pick = (editionId) => {
    setPickerOpen(false);
    if (editionId !== edition.id) switchTo(editionId);
  };

  return (
    <>
      <div className="demo-banner" role="status">
        <span>
          <strong>Bản dùng thử</strong> · Dữ liệu chỉ lưu trên trình duyệt này ·
          Ngành: <strong>{edition.name}</strong> · Mật khẩu hệ thống:{' '}
          <code>{DEMO_SYSTEM_PASSWORD}</code>
        </span>
        <Space wrap size="small">
          <Button size="small" disabled={busy} onClick={() => setPickerOpen(true)}>
            Đổi ngành
          </Button>
          <Button size="small" disabled={busy} onClick={restore}>
            Khôi phục dữ liệu mẫu
          </Button>
          {CONTACT_URL && (
            <Button size="small" type="primary" href={CONTACT_URL} target="_blank" rel="noopener noreferrer">
              Liên hệ mua
            </Button>
          )}
        </Space>
      </div>
      {notices.map((notice) => (
        <Alert key={notice} banner closable type="info" message={notice} />
      ))}
      <Modal
        open={pickerOpen}
        title="Đổi loại cửa hàng"
        footer={null}
        width={760}
        onCancel={() => setPickerOpen(false)}
      >
        <EditionGrid activeId={edition.id} onPick={pick} />
      </Modal>
      <Spin spinning={busy} fullscreen tip="Đang chuẩn bị dữ liệu mẫu..." />
    </>
  );
};

export default DemoBanner;
```

- [ ] **Step 9: Create `ui/DemoGate.jsx`**

```jsx
import { Button, Result, Spin, Typography } from 'antd';
import { cloneElement } from 'react';
import DemoBanner from './DemoBanner.jsx';
import EditionPicker from './EditionPicker.jsx';
import { useDemoSession } from './useDemoSession.js';

const Loading = ({ text }) => (
  <div className="demo-center">
    <Spin size="large" />
    <Typography.Text type="secondary">{text}</Typography.Text>
  </div>
);

// Wraps <App/> in demo builds: storage check, edition choice, then app + banner.
const DemoGate = ({ app }) => {
  const { state, chooseEdition } = useDemoSession();

  switch (state.status) {
    case 'booting':
      return <Loading text="Đang mở bản dùng thử..." />;
    case 'seeding':
      return <Loading text="Đang tạo dữ liệu mẫu, vui lòng chờ vài giây..." />;
    case 'blocked':
      return (
        <Result
          status="warning"
          title="Không chạy được bản dùng thử"
          subTitle="Trình duyệt đang chặn lưu trữ cục bộ. Hãy tắt chế độ ẩn danh hoặc cho phép trang web lưu dữ liệu rồi tải lại trang."
        />
      );
    case 'error':
      return (
        <Result
          status="error"
          title="Không khởi tạo được bản dùng thử"
          subTitle={state.error}
          extra={<Button onClick={() => window.location.reload()}>Tải lại</Button>}
        />
      );
    case 'picking':
      return <EditionPicker notices={state.notices} onPick={chooseEdition} />;
    default:
      return (
        <>
          <DemoBanner edition={state.edition} notices={state.notices} />
          {cloneElement(app, { title: state.edition.appTitle })}
        </>
      );
  }
};

export default DemoGate;
```

- [ ] **Step 10: Create `ui/demo.css`**

```css
.demo-banner {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 6px 16px;
  background: #fffbe6;
  border-bottom: 1px solid #ffe58f;
  font-size: 13px;
}

.demo-picker {
  max-width: 880px;
  margin: 48px auto;
  padding: 0 16px;
}

.demo-edition-card {
  height: 100%;
}

.demo-notice {
  margin-bottom: 16px;
}

.demo-center {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
}
```

- [ ] **Step 11: Create `mountDemo.jsx`**

```jsx
import DemoGate from './ui/DemoGate.jsx';
import './ui/demo.css';

// Entry point loaded by main.jsx only when __DEMO__ is true.
export const wrapWithDemo = (app) => <DemoGate app={app} />;
```

- [ ] **Step 12: Verify lint and both builds**

Run: `cd banhang && npm run lint && npm run build && npm run build:demo`
Expected: no lint errors; both builds succeed.

- [ ] **Step 13: Manual smoke test**

Run: `cd banhang && VITE_DEMO=true npx vite --port 5174`, open `http://localhost:5174`:
1. Edition picker shows 4 cards → choose "Vật liệu xây dựng" → app opens with banner and VLXD title.
2. Dashboard shows today's numbers; Reports show 30 days; create a sale → stock/debt update.
3. Reload → same data. "Đổi ngành" → Nhà thuốc → reload with pharmacy data; switch back → VLXD data intact.
4. "Khôi phục dữ liệu mẫu" → confirm → data reset.

- [ ] **Step 14: Commit**

```bash
git add banhang/src/constants banhang/src/App.jsx banhang/src/main.jsx banhang/src/demo/mountDemo.jsx banhang/src/demo/ui
git commit -m "feat(demo): add edition picker, demo banner and demo entry"
```

---

### Task 13: Vercel config and bundle isolation check

**Files:**
- Create: `banhang/vercel.json`

- [ ] **Step 1: Create `vercel.json`**

```json
{
  "installCommand": "ELECTRON_SKIP_BINARY_DOWNLOAD=1 npm ci",
  "buildCommand": "npm run build:demo",
  "outputDirectory": "dist",
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```

- [ ] **Step 2: Verify the normal bundle has no demo code**

Run: `cd banhang && npm run build && ! grep -rl "bh-demo" dist && echo CLEAN`
Expected: `CLEAN`

- [ ] **Step 3: Verify the demo bundle contains it**

Run: `cd banhang && npm run build:demo && grep -rl "bh-demo" dist | head -1`
Expected: one `dist/assets/*.js` path.

- [ ] **Step 4: Commit**

```bash
git add banhang/vercel.json
git commit -m "build: add vercel config for the browser demo"
```

Vercel project settings (manual, once): Root Directory `banhang`; enable "Include files outside the root directory in the Build Step"; env `VITE_CONTACT_URL` (optional); production branch of your choice.

---

### Task 14: Documentation for future work

**Files:**
- Create: `CLAUDE.md`, `banhang/src/demo/README.md`, `banhang-backend/README.md`
- Modify: `banhang/AGENT.md`

- [ ] **Step 1: Write `banhang/src/demo/README.md`** — sections: Purpose; Rules (backend is the only business logic; shims support only listed features and fail loudly; demo code only behind `__DEMO__`; files ≤ 200 lines); Folder map (one line per file); Request flow diagram (`store → apiRequest → transport → dispatch → express shim → backend router → service → mongoose shim → localStore`); Storage keys; Recipes: add an edition, backend starts using a new Mongo feature, bump `SCHEMA_VERSION`, run/test/deploy commands.

- [ ] **Step 2: Write `banhang-backend/README.md`** — layout of `src/` (`models`, `routes`, `modules/*/{routes,controllers,services,repositories}`, `services`, `utils`), the request path, and the demo constraints: services/modules import models only via `models/*`, never `mongoose`; allowed model methods/operators are enforced by `banhang/src/demo/__tests__/backendCompat.test.js`; new routers must be mounted in `routes/index.js`.

- [ ] **Step 3: Write root `CLAUDE.md`** — repo map (banhang, banhang-backend, packaging, docs/superpowers), commands (dev, test, build, build:demo, backend test), pointers to `banhang/AGENT.md`, `banhang/src/demo/README.md`, `banhang-backend/README.md`, and the note about `banhang/.env` breaking two tests.

- [ ] **Step 4: Update `banhang/AGENT.md`** — section 6: replace "Dexie/API" with "API via `src/db/repository.js` (transport in `src/db/transport.js`)"; section 10 title "Working Mode for Codex" → "Working Mode for AI agents"; add section "11) Demo mode" pointing to `src/demo/README.md` with the 3 key rules.

- [ ] **Step 5: Format and final verification**

Run:
```bash
cd banhang && npx prettier --write src/demo src/db src/constants src/App.jsx src/main.jsx src/pages/Catalog/openingImportApi.js vite.config.js vercel.json
npm run lint && VITE_API_URL= npx vitest run && npm run build && npm run build:demo
cd ../banhang-backend && npx vitest run
```
Expected: all green.

- [ ] **Step 6: Commit**

```bash
git add CLAUDE.md banhang/AGENT.md banhang/src/demo/README.md banhang-backend/README.md banhang
git commit -m "docs: document demo architecture and contributor rules"
```
