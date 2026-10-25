# banhang-backend

Express + Mongoose API for BanHang. The same source also runs **inside the browser** for the
Vercel demo (see `banhang/src/demo/README.md`), so a few rules below are mandatory.

## Layout (`src/`)

| Path                                                        | Responsibility                                                                    |
| ----------------------------------------------------------- | --------------------------------------------------------------------------------- |
| `index.js`                                                  | Connects MongoDB, starts the server (server only)                                 |
| `app.js`                                                    | Express app: middleware, static frontend, `/api/reset`, `/api/seed` (server only) |
| `seedData.js`                                               | Sample data for the server `/api/seed` (server only)                              |
| `routes/index.js`                                           | `crudModels` + `mountApiRoutes(app)` — **every API router is mounted here**       |
| `routes/*.js`                                               | Re-exports of module routers, generic CRUD router                                 |
| `modules/<name>/{routes,controllers,services,repositories}` | Feature modules                                                                   |
| `controllers/`, `services/`, `utils/`                       | Shared CRUD, snapshot (stock/debt), report helpers                                |
| `models/*.js`                                               | Mongoose schemas — the only files that import `mongoose`                          |

Request path: `router → controller (req/res) → service (rules) → repository/model`.

## Rules for browser-demo compatibility

1. Only `models/*.js` may import `mongoose`. Services, repositories and utils import models.
2. Use only the model API the demo shim supports: `find`, `findOne`, `create`, `insertMany`,
   `findOneAndUpdate` (`new`, `upsert`), `updateMany`, `deleteMany`, `bulkWrite` (`updateOne`),
   query `.sort()`, `.limit()`, `.lean()`; filter operators `$eq $ne $in $nin $gt $gte $lt $lte
$exists $or $and`; update operators `$set $inc`.
3. Controllers use only `req.body`, `req.params`, `req.query`, `res.status()`, `res.json()`.
4. Mount new routers in `routes/index.js`, not in `app.js`.
5. Allowed third-party imports in shared code: `express` (Router only), `dayjs`, `uuid`.

`banhang/src/demo/__tests__/backendCompat.test.js` enforces 1–2. If you need a new Mongo feature,
extend the demo shim first (recipe in `banhang/src/demo/README.md`).

## Edition / customer modules

Industry- or customer-specific API lives outside core:

```
src/editions/<id>/index.js     defineBackendModule({ id, routers: [['/api/<id>/...', router]] })
src/customers/<id>/index.js    same, for one customer (template: customers/example)
src/platform/                  defineBackendModule, loadBackendModules
```

- The server loads the modules named by `BANHANG_EDITION` (default `nhomkinh`) and
  `BANHANG_CUSTOMER` from `.env`, then mounts their routers after core routes
  (`mountApiRoutes(app, { modules })`). Editions without a backend folder are fine.
- Installers ship only the selected module folders and write those env vars.
- Core never imports module folders; modules import only core, `platform/` and themselves
  (`src/__tests__/moduleBoundaries.test.js`). Module code follows the same mongoose subset
  rules as core so it also runs in the browser demo.

## Commands

```bash
npm run dev     # watch mode, needs MONGODB_URI
npm test        # vitest
npm run lint
```
