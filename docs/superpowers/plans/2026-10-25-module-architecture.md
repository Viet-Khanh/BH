# Module Architecture Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn the 2a edition config into a module system — core + edition modules + customer modules (FE and BE) — selected at build time for installers and at runtime for the web demo.

**Architecture:** `src/platform/` owns the extension system (define/compose/runtime/slots). A Vite plugin generates `virtual:banhang-modules` that imports only the selected edition (+customer) for real builds, or every edition for demo/test. Backend modules are loaded from env at server start and mounted after core routes. Plain-data catalogs (`editions/catalog.js`, `customers/catalog.js`) are the single source for build identity (Vite, `scripts/buildTarget.mjs`, Windows packaging).

**Tech Stack:** React 18, Vite 5 (custom plugin, `import.meta.glob`), Vitest 3, Express/Mongoose backend, PowerShell + Inno Setup packaging.

**Spec:** `docs/superpowers/specs/2026-10-25-module-architecture-design.md`

**Conventions:** `banhang/AGENT.md` (≤ 200 lines/file, logic outside JSX), Prettier. FE tests: `VITE_API_URL= npx vitest run`.

---

## File map

Create (FE `banhang/`):
- `src/editions/catalog.js`, `src/customers/catalog.js` — plain data
- `src/platform/{buildTarget,slots,defineModule,composeModules,resolveSlot,moduleRuntime,useActiveModule}.js`, `src/platform/Slot.jsx`
- `src/editions/<id>/index.js` ×5 (replace `src/editions/<id>.js`)
- `src/customers/example/{index.js,ExampleHelpPage.jsx}`
- `vite/modulesPlugin.js`, `scripts/buildTarget.mjs`, `scripts/verifyBundles.mjs`
- Tests: `src/platform/__tests__/{buildTarget,defineModule,composeModules,moduleBoundaries,editions}.test.js`, `vite/__tests__/modulesPlugin.test.js`

Delete: `src/editions/{editionIds,modules,index,editionRuntime,useEdition,nhomkinh,vlxd,minimart,fashion,pharmacy}.js`, `src/editions/__tests__/*` (moved to platform tests).

Create (BE `banhang-backend/src/`): `platform/{defineBackendModule,loadBackendModules}.js`, `customers/example/index.js`, tests `__tests__/{backendModules,moduleBoundaries}.test.js`.

Modify: `vite.config.js`, `package.json` (scripts), `App.jsx`, `main.jsx`, `pages/Home.jsx`, `pages/homeTiles.js`, `pages/Catalog/CatalogFormModal.jsx`, `components/InvoiceEditor.jsx`, `features/purchases/screen/PurchasesScreen.jsx`, `utils/printItems.js`, all importers of `editions/useEdition.js` / `editions/editionRuntime.js`, demo (`editions/index.js`, `session/demoSession.js`, tests), backend `app.js`, `index.js`, `routes/index.js`, `demo/demoApp.js`, packaging `build-release.ps1`, `BanHang.iss`, docs.

---

### Task 1: Catalogs and build target

- [ ] **Test** `src/platform/__tests__/buildTarget.test.js`:
```js
import { expect, it } from 'vitest';
import { resolveBuildTarget } from '../buildTarget.js';

it('defaults to the legacy aluminium/glass identity', () => {
  expect(resolveBuildTarget()).toEqual({
    edition: 'nhomkinh',
    customer: null,
    productName: 'BanHang',
    appExeName: 'BanHang.exe',
    appId: 'com.rostek.banhang',
    installerGuid: 'D0196E87-7934-44B9-A107-6C5F0B6F9C72',
    installerBaseName: 'BanHang-Setup',
  });
});

it('resolves an edition build', () => {
  expect(resolveBuildTarget({ edition: 'pharmacy' })).toMatchObject({
    edition: 'pharmacy',
    customer: null,
    productName: 'BanHang-NhaThuoc',
    appId: 'com.rostek.banhang.pharmacy',
    installerBaseName: 'BanHang-NhaThuoc-Setup',
  });
});

it('derives the edition from a customer', () => {
  expect(resolveBuildTarget({ customer: 'example' })).toMatchObject({
    edition: 'nhomkinh',
    customer: 'example',
    appId: 'com.rostek.banhang.customer.example',
  });
});

it('rejects unknown ids and mismatches', () => {
  expect(() => resolveBuildTarget({ edition: 'nope' })).toThrow('Unknown edition "nope"');
  expect(() => resolveBuildTarget({ customer: 'nope' })).toThrow('Unknown customer "nope"');
  expect(() => resolveBuildTarget({ edition: 'pharmacy', customer: 'example' })).toThrow(
    'Customer "example" extends "nhomkinh", not "pharmacy"'
  );
});
```
- [ ] **Implement** `src/editions/catalog.js`:
```js
// Plain data (no imports): read by vite.config.js, scripts/buildTarget.mjs and tests.
// nhomkinh keeps the original installer identity so existing installs upgrade in place.
export const DEFAULT_EDITION_ID = 'nhomkinh';

export const EDITION_CATALOG = {
  nhomkinh: {
    productName: 'BanHang',
    appId: 'com.rostek.banhang',
    installerGuid: 'D0196E87-7934-44B9-A107-6C5F0B6F9C72',
    installerBaseName: 'BanHang-Setup',
  },
  vlxd: {
    productName: 'BanHang-VLXD',
    appId: 'com.rostek.banhang.vlxd',
    installerGuid: '6F1C2A0E-3B7D-4C59-9E21-5A8D0C4B7F13',
    installerBaseName: 'BanHang-VLXD-Setup',
  },
  minimart: {
    productName: 'BanHang-TapHoa',
    appId: 'com.rostek.banhang.minimart',
    installerGuid: '2B9E4D71-8C3A-4F06-B5D2-71E6A9C03F48',
    installerBaseName: 'BanHang-TapHoa-Setup',
  },
  fashion: {
    productName: 'BanHang-ThoiTrang',
    appId: 'com.rostek.banhang.fashion',
    installerGuid: 'A47C3E19-5D2B-4E8F-9A61-0B3F7D2C8E54',
    installerBaseName: 'BanHang-ThoiTrang-Setup',
  },
  pharmacy: {
    productName: 'BanHang-NhaThuoc',
    appId: 'com.rostek.banhang.pharmacy',
    installerGuid: 'C3D85F02-6E1A-4B97-8D40-2F9A6B1E7C35',
    installerBaseName: 'BanHang-NhaThuoc-Setup',
  },
};

export const EDITION_IDS = Object.keys(EDITION_CATALOG);
```
`src/customers/catalog.js`:
```js
// Plain data (no imports). One entry per customer build; `edition` is the parent edition.
export const CUSTOMER_CATALOG = {
  example: {
    edition: 'nhomkinh',
    productName: 'BanHang-Example',
    appId: 'com.rostek.banhang.customer.example',
    installerGuid: 'E8B21C6D-4F35-4A07-91DC-3E5B7A9F0D26',
    installerBaseName: 'BanHang-Example-Setup',
  },
};
```
`src/platform/buildTarget.js`:
```js
import { CUSTOMER_CATALOG } from '../customers/catalog.js';
import { DEFAULT_EDITION_ID, EDITION_CATALOG, EDITION_IDS } from '../editions/catalog.js';

const identity = ({ productName, appId, installerGuid, installerBaseName }) => ({
  productName,
  appExeName: `${productName}.exe`,
  appId,
  installerGuid,
  installerBaseName,
});

// Which edition/customer a build contains and how its installer is named.
// Used at build time only (vite.config.js, scripts/buildTarget.mjs).
export const resolveBuildTarget = ({ edition, customer } = {}) => {
  if (customer) {
    const entry = CUSTOMER_CATALOG[customer];
    if (!entry) {
      const known = Object.keys(CUSTOMER_CATALOG).join(', ');
      throw new Error(`Unknown customer "${customer}". Known: ${known}`);
    }
    if (edition && edition !== entry.edition) {
      throw new Error(`Customer "${customer}" extends "${entry.edition}", not "${edition}"`);
    }
    return { edition: entry.edition, customer, ...identity(entry) };
  }
  const editionId = edition || DEFAULT_EDITION_ID;
  const entry = EDITION_CATALOG[editionId];
  if (!entry) {
    throw new Error(`Unknown edition "${editionId}". Known: ${EDITION_IDS.join(', ')}`);
  }
  return { edition: editionId, customer: null, ...identity(entry) };
};
```
`scripts/buildTarget.mjs`:
```js
// CLI for packaging scripts: node scripts/buildTarget.mjs [--edition=id] [--customer=id]
import { resolveBuildTarget } from '../src/platform/buildTarget.js';

const args = Object.fromEntries(
  process.argv.slice(2).map((arg) => arg.replace(/^--/, '').split('='))
);

try {
  const target = resolveBuildTarget({ edition: args.edition, customer: args.customer });
  process.stdout.write(`${JSON.stringify(target)}\n`);
} catch (error) {
  process.stderr.write(`${error.message}\n`);
  process.exit(1);
}
```
- [ ] Run tests → PASS; `node scripts/buildTarget.mjs --customer=example` prints JSON. Commit `feat(platform): add edition/customer catalogs and build target`.

### Task 2: Module definition, composition, slots

- [ ] **Tests** `defineModule.test.js`, `composeModules.test.js`:
```js
// defineModule.test.js
import { expect, it } from 'vitest';
import { defineCustomer, defineEdition } from '../defineModule.js';

const config = { name: 'X' };

it('normalizes an edition', () => {
  expect(defineEdition({ id: 'x', config })).toMatchObject({
    kind: 'edition', id: 'x', routes: [], homeTiles: [], slots: {}, hideModules: [],
  });
});

it('rejects invalid modules', () => {
  expect(() => defineEdition({ config })).toThrow('missing id');
  expect(() => defineEdition({ id: 'x', config, extra: 1 })).toThrow('Module "x": unknown key "extra"');
  expect(() => defineEdition({ id: 'x', config, slots: { 'nope.slot': () => null } })).toThrow('unknown slot "nope.slot"');
  expect(() => defineEdition({ id: 'x', config, routes: [{ path: '/a' }] })).toThrow('route needs path and page');
  expect(() => defineCustomer({ id: 'c', config })).toThrow('missing "extends"');
});
```
```js
// composeModules.test.js
import { expect, it } from 'vitest';
import { composeModules, deepMerge } from '../composeModules.js';
import { defineCustomer, defineEdition } from '../defineModule.js';

const Page = () => null;
const Table = () => null;
const edition = defineEdition({
  id: 'pharmacy',
  config: { appTitle: 'A', features: { dimensions: false, sampleData: false }, labels: { spec: 'S', group: 'G' } },
  routes: [{ module: 'expiry', path: '/expiry', page: Page }],
  homeTiles: [{ module: 'expiry', label: 'HẠN DÙNG', to: '/expiry' }],
});
const customer = defineCustomer({
  id: 'ankhang',
  extends: 'pharmacy',
  config: { appTitle: 'B', labels: { spec: 'S2' } },
  hideModules: ['expiry', 'cashbook'],
  slots: { 'sales.itemsTable': Table },
});

it('deep merges plain objects and replaces the rest', () => {
  expect(deepMerge({ a: { b: 1, c: [1] } }, { a: { c: [2] }, d: 3 })).toEqual({ a: { b: 1, c: [2] }, d: 3 });
});

it('layers customer over edition', () => {
  const active = composeModules(edition, customer);
  expect(active).toMatchObject({ editionId: 'pharmacy', customerId: 'ankhang' });
  expect(active.config).toEqual({
    appTitle: 'B',
    features: { dimensions: false, sampleData: false },
    labels: { spec: 'S2', group: 'G' },
  });
  expect(active.slots['sales.itemsTable']).toBe(Table);
  expect(active.hiddenModules).toEqual(['expiry', 'cashbook']);
  expect(active.routes).toEqual([]);
  expect(active.homeTiles).toEqual([]);
});

it('works without a customer and rejects a foreign one', () => {
  expect(composeModules(edition).routes).toHaveLength(1);
  const other = defineCustomer({ id: 'x', extends: 'vlxd', config: {} });
  expect(() => composeModules(edition, other)).toThrow('Customer "x" extends "vlxd", not "pharmacy"');
});
```
- [ ] **Implement** `src/platform/slots.js`:
```js
// Every extension point core exposes. Modules may only fill these names.
export const SLOTS = {
  salesItemsTable: 'sales.itemsTable',
  purchasesItemsTable: 'purchases.itemsTable',
  catalogProductFields: 'catalog.productFields',
  printItemColumns: 'print.itemColumns',
};

export const SLOT_NAMES = Object.values(SLOTS);
```
`src/platform/defineModule.js`:
```js
import { SLOT_NAMES } from './slots.js';

const EDITION_KEYS = ['id', 'config', 'routes', 'homeTiles', 'hideModules', 'slots'];
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
    if (!tile.module || !tile.label) fail(id, 'home tile needs module and label');
  });
};

const normalize = (kind, module) =>
  Object.freeze({ kind, routes: [], homeTiles: [], hideModules: [], slots: {}, ...module });

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
```
`src/platform/composeModules.js`:
```js
const isPlainObject = (value) =>
  Boolean(value) && Object.getPrototypeOf(value) === Object.prototype;

// Plain objects merge key by key; arrays, functions and scalars are replaced.
export const deepMerge = (base, override) => {
  if (override === undefined) return base;
  if (!isPlainObject(base) || !isPlainObject(override)) return override;
  const keys = new Set([...Object.keys(base), ...Object.keys(override)]);
  return Object.fromEntries([...keys].map((key) => [key, deepMerge(base[key], override[key])]));
};

// Active app definition: edition, then customer on top (later wins).
export const composeModules = (edition, customer = null) => {
  if (customer && customer.extends !== edition.id) {
    throw new Error(`Customer "${customer.id}" extends "${customer.extends}", not "${edition.id}"`);
  }
  const layers = customer ? [edition, customer] : [edition];
  const hiddenModules = [...new Set(layers.flatMap((layer) => layer.hideModules))];
  const visible = (entry) => !hiddenModules.includes(entry.module);
  return Object.freeze({
    editionId: edition.id,
    customerId: customer?.id || null,
    config: layers.reduce((config, layer) => deepMerge(config, layer.config), {}),
    routes: layers.flatMap((layer) => layer.routes).filter(visible),
    homeTiles: layers.flatMap((layer) => layer.homeTiles).filter(visible),
    hiddenModules,
    slots: Object.assign({}, ...layers.map((layer) => layer.slots)),
  });
};
```
`src/platform/resolveSlot.js`:
```js
import { getActiveModule } from './moduleRuntime.js';
import { SLOT_NAMES } from './slots.js';

export const resolveSlotIn = (activeModule, name, fallback) => {
  if (!SLOT_NAMES.includes(name)) throw new Error(`Unknown slot "${name}"`);
  return activeModule.slots[name] ?? fallback;
};

// Module override for an extension point, or core's fallback.
export const resolveSlot = (name, fallback) =>
  resolveSlotIn(getActiveModule(), name, fallback);
```
`src/platform/Slot.jsx`:
```jsx
import { resolveSlot } from './resolveSlot.js';

// Renders the module component registered for `name`, else `fallback` (or nothing).
const Slot = ({ name, fallback = null, ...props }) => {
  const Component = resolveSlot(name, fallback);
  return Component ? <Component {...props} /> : null;
};

export default Slot;
```
Add to `composeModules.test.js`: `resolveSlotIn(composeModules(edition, customer), 'sales.itemsTable', Page)` is `Table`; `'print.itemColumns'` returns fallback; unknown slot throws.
- [ ] Tests PASS. Commit `feat(platform): add module definition, composition and slots`.

### Task 3: Vite plugin and runtime

- [ ] **Test** `vite/__tests__/modulesPlugin.test.js`:
```js
import { expect, it } from 'vitest';
import { buildModulesSource } from '../modulesPlugin.js';

it('imports every edition and no customer for demo/test', () => {
  const source = buildModulesSource({ allEditions: true });
  expect(source).toContain("/src/editions/pharmacy/index.js");
  expect(source).not.toContain('/src/customers/');
  expect(source).toContain('export const selectable = true;');
});

it('imports only the selected edition and customer for real builds', () => {
  const source = buildModulesSource({ customer: 'example' });
  expect(source).toContain("/src/editions/nhomkinh/index.js");
  expect(source).toContain("/src/customers/example/index.js");
  expect(source).not.toContain('pharmacy');
  expect(source).toContain('export const selectable = false;');
});

it('fails on unknown ids', () => {
  expect(() => buildModulesSource({ edition: 'nope' })).toThrow('Unknown edition');
});
```
- [ ] **Implement** `vite/modulesPlugin.js`:
```js
import { EDITION_IDS } from '../src/editions/catalog.js';
import { resolveBuildTarget } from '../src/platform/buildTarget.js';

const VIRTUAL_ID = 'virtual:banhang-modules';
const RESOLVED_ID = `\0${VIRTUAL_ID}`;

const editionPath = (id) => `/src/editions/${id}/index.js`;
const customerPath = (id) => `/src/customers/${id}/index.js`;

// Source of `virtual:banhang-modules`: which edition/customer modules the bundle contains.
export const buildModulesSource = ({ allEditions = false, edition, customer } = {}) => {
  if (allEditions) {
    const imports = EDITION_IDS.map((id, i) => `import edition${i} from '${editionPath(id)}';`);
    const list = EDITION_IDS.map((_, i) => `edition${i}`).join(', ');
    return [...imports, `export const editions = [${list}];`, 'export const customer = null;', 'export const selectable = true;'].join('\n');
  }
  const target = resolveBuildTarget({ edition, customer });
  return [
    `import edition from '${editionPath(target.edition)}';`,
    target.customer ? `import customerModule from '${customerPath(target.customer)}';` : 'const customerModule = null;',
    'export const editions = [edition];',
    'export const customer = customerModule;',
    'export const selectable = false;',
  ].join('\n');
};

export const banhangModules = (options) => {
  const source = buildModulesSource(options); // validates ids before the build starts
  return {
    name: 'banhang-modules',
    resolveId: (id) => (id === VIRTUAL_ID ? RESOLVED_ID : null),
    load: (id) => (id === RESOLVED_ID ? source : null),
  };
};
```
`vite.config.js`: drop `assertKnownEdition`/`EDITION_IDS` import; add plugin
```js
import { banhangModules } from './vite/modulesPlugin.js';
...
  const isDemo = env.VITE_DEMO === 'true';
  return {
    plugins: [
      react(),
      banhangModules({
        // Demo picks the edition at runtime; tests need every edition.
        allEditions: isDemo || mode === 'test',
        edition: env.VITE_EDITION,
        customer: env.VITE_CUSTOMER,
      }),
    ],
    define: { __DEMO__: JSON.stringify(isDemo) },
```
`src/platform/moduleRuntime.js`:
```js
import { customer, editions, selectable } from 'virtual:banhang-modules';
import { composeModules } from './composeModules.js';

const editionsById = new Map(editions.map((edition) => [edition.id, edition]));
let active = null;

const compose = (editionId) => {
  const edition = editionsById.get(editionId);
  if (!edition) throw new Error(`Unknown edition "${editionId}"`);
  return composeModules(edition, customer);
};

// Real builds contain one edition (+ customer); demo/test builds contain all editions.
export const getActiveModule = () => {
  if (!active) active = compose(editions[0].id);
  return active;
};

// Demo only: the visitor picks an edition. Real builds cannot switch.
export const setActiveEdition = (editionId) => {
  if (!selectable && editionId !== getActiveModule().editionId) {
    throw new Error('This build contains a single edition');
  }
  active = compose(editionId);
  return active;
};

export const getAvailableEditions = () => editions;

export const getEditionConfig = () => getActiveModule().config;

export const hasFeature = (name) => Boolean(getEditionConfig().features?.[name]);

export const applyEditionToDocument = () => {
  if (typeof document !== 'undefined') document.title = getEditionConfig().appTitle;
};
```
`src/platform/useActiveModule.js`:
```js
import { getActiveModule, hasFeature } from './moduleRuntime.js';

// The active module never changes while a page is open (the demo reloads on switch),
// so these hooks read the runtime directly.
export const useActiveModule = () => getActiveModule();

export const useEdition = () => getActiveModule().config;

export const useEditionFeature = (name) => hasFeature(name);
```
- [ ] Tests PASS. Commit `feat(platform): generate module list at build time and add runtime`.

### Task 4: Edition modules replace 2a configs

- [ ] Create `src/editions/<id>/index.js` for the five editions with `defineEdition({ id, config: {...} })` — config = the 2a object minus `id` and `modules` (name, tagline, appTitle, defaultShopName, invoiceTagline, features, labels). Delete the 2a files and `src/editions/__tests__`.
- [ ] **Test** `src/platform/__tests__/editions.test.js` (replaces 2a tests):
```js
import { afterEach, describe, expect, it } from 'vitest';
import { EDITION_IDS } from '../../editions/catalog.js';
import { getActiveModule, getAvailableEditions, getEditionConfig, hasFeature, setActiveEdition } from '../moduleRuntime.js';

const TEXT = ['name', 'tagline', 'appTitle', 'defaultShopName', 'invoiceTagline'];

afterEach(() => setActiveEdition('nhomkinh'));

describe.each(getAvailableEditions())('edition $id', (edition) => {
  it('has a complete config', () => {
    TEXT.forEach((key) => expect(edition.config[key]).toEqual(expect.any(String)));
    expect(edition.config.features).toEqual({ dimensions: expect.any(Boolean), sampleData: expect.any(Boolean) });
    expect(edition.config.labels).toEqual({ group: expect.any(String), spec: expect.any(String) });
  });
});

it('matches the catalog order', () => {
  expect(getAvailableEditions().map((edition) => edition.id)).toEqual(EDITION_IDS);
});

it('defaults to the legacy edition and switches in demo/test builds', () => {
  expect(getActiveModule().editionId).toBe('nhomkinh');
  expect(getEditionConfig().invoiceTagline).toBe('CHUYÊN NHÔM - XINGFA - PMA - SHALUMI - KÍNH - TRẦN THẢ - ALU CÁC LOẠI');
  setActiveEdition('pharmacy');
  expect(hasFeature('dimensions')).toBe(false);
  expect(() => setActiveEdition('nope')).toThrow('Unknown edition "nope"');
});
```
- [ ] Migrate core imports: `editions/useEdition.js` → `platform/useActiveModule.js`; `editions/editionRuntime.js` → `platform/moduleRuntime.js` with `getEdition()` → `getEditionConfig()`, `setEdition` → `setActiveEdition` (tests, demo session). `pages/homeTiles.js`: `getVisibleTiles(tiles, hiddenModules)` filters by hidden keys; `Home.jsx`: `const { homeTiles, hiddenModules } = useActiveModule();` and `getVisibleTiles([...HOME_TILES, ...homeTiles], hiddenModules)`; update `homeTiles.test.js` accordingly. Demo: `DEMO_EDITIONS = getAvailableEditions().map((e) => ({ id: e.id, ...e.config, ...SEED_DATA[e.id] }))`; `demoSession.activateRuntime` → `setActiveEdition(edition.id); applyEditionToDocument();`.
- [ ] Full FE suite + build + build:demo PASS. Commit `refactor(editions): edition modules on the platform runtime`.

### Task 5: Wire slots and module routes into core

- [ ] `App.jsx`: `const { routes } = useActiveModule();` and before the catch-all route
  `{routes.map((route) => <Route key={route.path} path={route.path} element={createElement(route.page)} />)}`.
- [ ] `InvoiceEditor.jsx`: `<Slot name={SLOTS.salesItemsTable} fallback={InvoiceItemsTable} {...itemsTableProps} />`.
- [ ] `PurchasesScreen.jsx`: same with `SLOTS.purchasesItemsTable`.
- [ ] `CatalogFormModal.jsx`: after the group/spec row `<Slot name={SLOTS.catalogProductFields} form={form} labels={labels} />`.
- [ ] `utils/printItems.js`: `const buildColumns = resolveSlot(SLOTS.printItemColumns, buildPrintItemColumns); const columns = buildColumns({ dimensions });`.
- [ ] Suite + builds PASS. Commit `feat(platform): expose routes, home tiles and component slots to modules`.

### Task 6: Example customer

- [ ] `src/customers/example/ExampleHelpPage.jsx` (simple page with title "Hướng dẫn khách hàng mẫu" and text explaining it lives in `src/customers/example`), `index.js`:
```js
import { defineCustomer } from '../../platform/defineModule.js';
import ExampleHelpPage from './ExampleHelpPage.jsx';

// Template for real customers: copy this folder, register it in ../catalog.js.
export default defineCustomer({
  id: 'example',
  extends: 'nhomkinh',
  config: { appTitle: 'PHẦN MỀM BÁN HÀNG - KHÁCH HÀNG MẪU' },
  routes: [{ module: 'example-help', path: '/example-help', page: ExampleHelpPage }],
  homeTiles: [{ module: 'example-help', label: 'HƯỚNG DẪN', tone: 'linear-gradient(135deg, #3f5bd9, #6b4fd6)', to: '/example-help' }],
});
```
- [ ] `VITE_CUSTOMER=example npm run build` PASS. Commit `feat(customers): add example customer module`.

### Task 7: Boundary guard (FE)

- [ ] `src/platform/__tests__/moduleBoundaries.test.js` scans `src/**/*.{js,jsx}` (excluding `__tests__`), resolves relative imports and asserts:
  - core files never import `editions/<id>/` or `customers/<id>/` (catalog files are allowed: plain data);
  - core imports `demo/` only from `main.jsx` and `db/transport.js`;
  - `platform/` imports nothing from `editions/<id>/`, `customers/<id>/`, `demo/`;
  - `editions/<id>/` imports only core, `platform/` and its own folder;
  - `customers/<id>/` imports only core, `platform/`, its own folder and its parent edition (from `CUSTOMER_CATALOG`).
- [ ] PASS. Commit `test(platform): enforce module boundaries`.

### Task 8: Backend modules

- [ ] **Test** `banhang-backend/src/__tests__/backendModules.test.js`:
```js
import express from 'express';
import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { defineBackendModule } from '../platform/defineBackendModule.js';
import { loadBackendModules, readModuleSelection } from '../platform/loadBackendModules.js';
import { mountApiRoutes } from '../routes/index.js';

describe('backend modules', () => {
  it('reads selection from env with nhomkinh default', () => {
    expect(readModuleSelection({})).toEqual({ edition: 'nhomkinh', customer: null });
    expect(readModuleSelection({ BANHANG_EDITION: 'pharmacy', BANHANG_CUSTOMER: 'x' })).toEqual({ edition: 'pharmacy', customer: 'x' });
  });

  it('loads existing modules and skips editions without backend code', async () => {
    const modules = await loadBackendModules({ edition: 'nhomkinh', customer: 'example' });
    expect(modules.map((module) => module.id)).toEqual(['example']);
  });

  it('validates router prefixes', () => {
    expect(() => defineBackendModule({ id: 'x', routers: [['/x', express.Router()]] })).toThrow('must start with /api/');
  });

  it('mounts module routers after core routes', async () => {
    const [example] = await loadBackendModules({ customer: 'example' });
    const app = mountApiRoutes(express(), { modules: [example] });
    const response = await request(app).get('/api/example/ping');
    expect(response.body).toEqual({ ok: true, module: 'example' });
  });
});
```
- [ ] **Implement** `platform/defineBackendModule.js`, `platform/loadBackendModules.js` (dynamic `import()`, `ERR_MODULE_NOT_FOUND` for the module's own path → null), `customers/example/index.js` (router `GET /ping` → `{ ok: true, module: 'example' }`, mounted at `/api/example`), `mountApiRoutes(app, { modules = [] } = {})`, `createApp({ modules })`, `index.js` loads modules from env before `createApp` and logs the selection.
- [ ] `banhang-backend/src/__tests__/moduleBoundaries.test.js`: backend core never imports `editions/` or `customers/`; module folders import only core, `platform/` and themselves.
- [ ] Demo: `demoApp.js` mounts `Object.values(import.meta.glob('@backend/editions/*/index.js', { eager: true, import: 'default' }))` (customers never).
- [ ] BE + FE suites PASS. Commit `feat(backend): load edition/customer backend modules`.

### Task 9: Packaging per edition/customer

- [ ] `build-release.ps1`: params `-Edition`, `-Customer`; resolve target with `node banhang/scripts/buildTarget.mjs`; set `VITE_EDITION`/`VITE_CUSTOMER`; `electron-builder --win --dir "-c.productName=…" "-c.appId=…"`; prune unselected `src/editions/*`, `src/customers/*` in the backend stage; append `BANHANG_EDITION`/`BANHANG_CUSTOMER` to `.env`; write `stage/build-target.json`; print the exact `ISCC` command with `/DAppName /DAppExeName /DAppGuid /DOutputBase`.
- [ ] `BanHang.iss`: `#ifndef` defaults equal today's values; use `{#AppName}`, `{#AppExeName}`, `AppId={{{#AppGuid}}`, `OutputBaseFilename={#OutputBase}-{#MyAppVersion}`.
- [ ] `packaging/windows/README.md`: build per edition/customer section, "one edition per machine" note.
- [ ] Commit `build(packaging): build installers per edition or customer`.

### Task 10: Bundle verification, browser smoke, docs

- [ ] `scripts/verifyBundles.mjs` + npm script `verify:bundles`: builds default, `pharmacy`, `example` customer and demo into temp dirs and asserts include/exclude strings (edition app titles, `bh-demo`, example title).
- [ ] Browser smoke (demo build): edition switching works, five editions listed; build `VITE_CUSTOMER=example` preview shows the example title, HƯỚNG DẪN tile and its page.
- [ ] Docs: `src/platform/README.md` (contract, slots table, add a slot), rewrite `src/editions/README.md`, new `src/customers/README.md`, backend README (backend modules), `CLAUDE.md`, `AGENT.md`, demo README references.
- [ ] Final: lint, FE + BE suites, `npm run verify:bundles`. Commit `docs: document module architecture`.
