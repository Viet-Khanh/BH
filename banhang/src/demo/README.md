# Browser demo mode (`src/demo`)

Runs the **real backend code** (`banhang-backend/src` routes → controllers → services → models)
inside the browser, persisted to `localStorage`, so the app can be hosted on Vercel without a server.
Enabled only in builds made with `VITE_DEMO=true` (`npm run build:demo`).

Design spec: `docs/superpowers/specs/2026-10-24-browser-demo-mode-design.md`.

## Rules (read before changing anything here)

1. **The backend is the only place for business logic.** Never re-implement stock, debt, cost,
   report or invoice rules in `src/demo`. If the demo shows a wrong number, fix the shim or the
   backend — not the demo.
2. **Shims support only what the backend uses, and fail loudly otherwise.** Unsupported model
   methods, options or Mongo operators throw `DemoModel: unsupported ...`. Never silently ignore.
3. **Demo code is reachable only behind `__DEMO__`.** `main.jsx` and `db/transport.js` use dynamic
   `import()` inside `__DEMO__` branches, so normal and Electron builds do not contain it.
   Never import from `src/demo` anywhere else.
4. Follow `banhang/AGENT.md`: files ≤ 200 lines, small single-purpose modules, JS only.

## Request flow

```
store / feature api
  → src/db/repository.js  apiRequest()
  → src/db/transport.js   sendRequest()  (__DEMO__ ? demoTransport : fetch)
  → demo/demoApp.js       dispatch({ method, path, body })
  → demo/shims/express.js router (mounted by banhang-backend/src/routes/index.js)
  → backend controller → service → model
  → demo/shims/mongoose.js → demo/db/DemoModel.js → demo/db/localStore.js → localStorage
```

`vite.config.js` aliases `express` → `shims/express.js`, `mongoose` → `shims/mongoose.js`,
`@backend` → `../banhang-backend/src`, and dedupes `dayjs`/`uuid` to banhang's copies.

## Folder map

| Path                     | Responsibility                                                                              |
| ------------------------ | ------------------------------------------------------------------------------------------- |
| `config.js`              | Storage keys, `SCHEMA_VERSION`, seed window, demo password, contact URL                     |
| `demoApp.js`             | Builds the router, `dispatch()` = in-browser HTTP call                                      |
| `demoSystemRoutes.js`    | Demo versions of server-only routes: `/api/health`, `/api/reset`, `/api/seed`               |
| `mountDemo.jsx`          | Entry loaded by `main.jsx`; wraps `<App/>` in `DemoGate`                                    |
| `shims/express.js`       | `Router`, `use(path, router)`, `get/post/put/delete`, `:params`, fake `res`                 |
| `shims/mongoose.js`      | `Schema`, `model()` → `DemoModel`                                                           |
| `db/schema.js`           | Strict casting, defaults (incl. function defaults), `required`, `unique`                    |
| `db/DemoModel.js`        | `find, findOne, create, insertMany, findOneAndUpdate, updateMany, deleteMany, bulkWrite`    |
| `db/DemoQuery.js`        | Thenable query: `sort`, `limit`, `lean`, `exec`                                             |
| `db/queryTools.js`       | mingo matcher + operator allowlist, sort, projection                                        |
| `db/applyUpdate.js`      | `$set`, `$inc`, upsert base                                                                 |
| `db/localStore.js`       | Namespaced collections, in-memory cache, quota handling                                     |
| `db/objectId.js`         | Monotonic 24-hex `_id`                                                                      |
| `editions/<id>/`         | Sample data per edition (`index.js`, `products.js`); display config lives in `src/editions` |
| `seed/`                  | Builds master data + 30 days of events and replays them through the real API                |
| `session/demoMeta.js`    | `bh-demo:meta`: schema version, active edition, seeded editions                             |
| `session/demoSession.js` | `bootDemoSession`, `activateEdition`, `resetEdition`                                        |
| `ui/`                    | `DemoGate`, `EditionPicker`, `EditionGrid`, `DemoBanner`, hooks, CSS                        |
| `__tests__/`             | Unit, contract (seed + endpoints) and backend-compatibility guard tests                     |

## Storage

- `bh-demo:meta` → `{ schemaVersion, activeEdition, editions: { [id]: { seededAt } } }`
- `bh-demo:v<SCHEMA_VERSION>:<editionId>:<collection>` → JSON array (collection = model name
  lower-cased: `product`, `invoice`, `payment`, …). Each edition keeps its own data.
- Typical size: ~100–140 KB per seeded edition (limit ≈ 5 MB).

## Recipes

### Add an edition

First create the edition config in `src/editions` (see `src/editions/README.md`). Then:

1. Copy `editions/minimart/` to `editions/<id>/`; edit `index.js` (seed data only: `id, seed,
codePrefix, shop, units, products, customers, suppliers, expenses, activity`) and `products.js`.
   - Product row: `[group, name, unit, spec, avgCost, sellPriceDefault, sellPriceWholesale, openingStock]`.
   - Exactly one customer with `profile: 'walkin'` named `Khách lẻ` (the sales screen selects it
     by name); others `regular` or `debtor`. Use a unique `seed` and `codePrefix`.
2. Register it in `SEED_DATA` in `editions/index.js`. `DEMO_EDITIONS` merges config + seed data in
   `EDITION_IDS` order (= picker order).
3. Run `npx vitest run src/demo` — `editions.test.js` and `seedContract.test.js` cover it automatically.

The demo session (`session/demoSession.js`) calls `setEdition()` from `src/platform/moduleRuntime.js`
when an edition becomes active, so the whole UI follows it.

### The backend starts using a new Mongo feature

`backendCompat.test.js` fails and names the method/operator.

1. Implement it in `db/DemoModel.js` / `db/applyUpdate.js` / `db/queryTools.js`.
2. Add it to the matching `SUPPORTED_*` list and a test in `demoModel.test.js`.
3. Run `npx vitest run src/demo`. Never only extend the allowlist.

New backend routers must be mounted in `banhang-backend/src/routes/index.js` (shared with the demo).

### Change stored data shape

Bump `SCHEMA_VERSION` in `config.js`. On next visit all `bh-demo:*` keys are wiped, the user sees
the edition picker with a notice, and data is reseeded.

### Commands

```bash
cd banhang
VITE_DEMO=true npx vite            # dev server in demo mode
npx vitest run src/demo            # demo tests
npm run build:demo                 # production demo build → dist/
npm run build && ! grep -rl bh-demo dist   # normal build must not contain demo code
```

### Deploy (Vercel)

`banhang/vercel.json` holds install/build/output/SPA rewrite. Project settings: Root Directory
`banhang`, enable "Include files outside the root directory in the Build Step" (the build imports
`../banhang-backend/src`). Optional env `VITE_CONTACT_URL` shows the "Liên hệ mua" button.
