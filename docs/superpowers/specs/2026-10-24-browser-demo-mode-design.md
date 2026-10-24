# Browser Demo Mode — Design

Date: 2026-10-24 · Status: approved · Sub-project 1 of the productization roadmap

## Goal

Publish a demo of BanHang on Vercel that runs with no backend server. The real
backend code (routes, controllers, services, models) runs inside the browser and
persists to `localStorage`. Visitors pick an industry edition and get realistic
sample data for it.

## Roadmap context

1. **This spec** — browser demo engine + per-industry sample data + Vercel deploy.
2a. Edition framework (per-industry config, modules on/off, extension fields).
2b+. Industry packs (minimart, VLXD, fashion size/colour, pharmacy lot/expiry).
3. Trial limit — deferred.

Industry-specific fields and features are **out of scope** here. Editions in
this spec differ only by sample data, shop name and invoice template.

## Approach (A1)

When built with `VITE_DEMO=true`, Vite aliases `express` and `mongoose` to
in-browser shims. Backend modules are imported unchanged from
`../banhang-backend/src`. The frontend's `apiRequest` dispatches to the
in-browser app instead of calling `fetch`.

Backend surface the shims must cover (measured 2026-10-24):

- Router: `express.Router()`, `get/post/put/delete`, mounting; `req.body`,
  `req.params`, `req.query`; `res.status`, `res.json`.
- Model: `find`, `findOne`, `create`, `insertMany`, `findOneAndUpdate`
  (`new`, `upsert`), `updateMany`, `deleteMany`, `bulkWrite` (`updateOne` only),
  query `.sort/.limit/.lean`.
- Filter operators: `$ne $in $nin $or $and $gt $gte $lte $exists` (via `mingo`).
- Update operators: `$set`, `$inc`.

## Components

```
banhang/src/demo/
  shims/express.js      Router + fake req/res
  shims/mongoose.js     Schema (definition + defaults), model() -> DemoModel
  db/DemoModel.js       model API on top of localStore, filter via mingo
  db/DemoQuery.js       chainable sort/limit/lean, thenable
  db/applyUpdate.js     $set / $inc / upsert
  db/localStore.js      localStorage persistence + in-memory cache
  demoApp.js            builds route tree from backend routes/index.js; dispatch()
  editions/             one folder per edition: meta, master data, transactions
  seed/                 seeding runner (master data insert + transaction replay)
  ui/                   DemoGate, EditionPicker, DemoBanner
  README.md             structure + rules + recipes
```

Backend change: route mounting moves from `app.js` to `src/routes/index.js`
(`mountApiRoutes(app)`), shared by `app.js` and `demoApp.js`. No logic change.

## Data flow

`store -> repository.apiRequest -> (VITE_DEMO ? demoApp.dispatch : fetch)`.
`dispatch(method, path, body)` returns `{ status, data }`; `apiRequest` keeps
current semantics (404 -> `null`, non-2xx -> throw `Error(message)`).
`openingImportApi.js` is routed through `apiRequest`.

## Storage

- Key per collection: `bh-demo:v1:<edition>:<collection>`.
- Meta key `bh-demo:meta`: `{ schemaVersion, activeEdition, editions: { [id]: { seededAt } } }`.
- Each collection loads once into memory, writes are write-through (sync).
- `QuotaExceededError`: roll back in-memory change, throw a Vietnamese message.
- Reads return `structuredClone` copies.
- Corrupt JSON: reseed that edition and notify.
- `schemaVersion` mismatch: wipe all `bh-demo:*`, reseed, notify.

## Sample data

Four editions: `minimart`, `vlxd`, `fashion`, `pharmacy`. Each has 28–32
products, 8 customers (some in debt), 3–4 suppliers, units, settings
(`systemPassword: '123456'`, default invoice template).

Seeding has two layers:
1. Master data posted to the real CRUD endpoints (`PUT /settings/main`,
   `POST /<table>/bulk`), so backend defaults (stock, debt) apply.
2. Transactions (≈10 purchases, 40–60 invoices, debt payments, cashbook)
   replayed through real endpoints with `dispatch`, dated across the last 30
   days, so stock, average cost, debt and snapshots are computed by backend code.

## UI

- `DemoGate`: no active edition -> `EditionPicker` (4 cards) -> seed with
  progress -> app. Storage unavailable -> blocking message.
- `DemoBanner`: "Bản dùng thử · Dữ liệu chỉ lưu trên trình duyệt này · Ngành: X"
  + [Đổi ngành] [Khôi phục dữ liệu mẫu] [Liên hệ mua] + system password hint.
  Edition switch/reset reload the page.
- `VITE_CONTACT_URL` drives the contact button (hidden if empty).
- Service worker is not registered in demo builds.

## Deploy

- `banhang` script `build:demo` = `cross-env VITE_DEMO=true vite build`.
- `banhang/vercel.json`: build command, `dist`, SPA rewrite.
- Vercel project: Root Directory `banhang`, include files outside root.
- `resolve.dedupe: ['dayjs', 'uuid']` so backend imports use `banhang` deps.
- Normal and Electron builds must not include demo code.

## Error handling

Behaviour mirrors the real server: unmatched route -> 404, thrown error -> 500
`{ message }`. Unsupported model method/operator throws
`DemoModel: unsupported ...` — never silently wrong.

## Testing

- Unit: express shim, DemoModel (each method/operator, upsert, defaults incl.
  function defaults), localStore (persist, quota rollback).
- Contract: seed each edition, call dashboard/reports/sales/debt endpoints,
  assert no error, non-empty, stock = opening + purchased − sold.
- Guard: scan `banhang-backend/src` for model methods / `$` operators outside
  the supported list; fail if found.
- Build: `build:demo` passes; normal `dist` contains no `bh-demo`.

## Documentation

- Root `CLAUDE.md`: repo map, commands, pointers to docs.
- `banhang/AGENT.md`: fix stale bits, add demo section.
- `banhang/src/demo/README.md`: structure, flow, rules, recipes (new edition,
  new Mongo operator, bump schemaVersion, deploy).
- `banhang-backend/README.md`: module layout; services never import `mongoose`.
