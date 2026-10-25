# Module Architecture (core + editions + customers) — Design

Date: 2026-10-25 · Status: approved · Builds on 2a (edition framework)

## Goal

One core application; each industry (edition) and, when needed, each customer is a
module that adds or replaces parts of it — frontend and backend — without editing
core. Real installs are built per edition/customer (installer download, no git);
the public web demo contains every edition and no customer code.

## Decisions

- Single repo, folder modules (no monorepo yet). Everything in `banhang/src`
  except `platform/`, `editions/`, `customers/`, `demo/` is **core**.
- Customers: config-only for most, optional code for some. A customer module
  extends exactly one edition and declares only differences.
- Merge order: core defaults ← edition ← customer.
- The default edition `nhomkinh` keeps today's installer identity
  (`BanHang`, appId `com.rostek.banhang`, Inno AppId) so existing installs upgrade.

## Layout

```
banhang/src/platform/        defineModule, composeModules, moduleRuntime, Slot/resolveSlot, slot names
banhang/src/editions/<id>/   edition modules (index.js = defineEdition(...))
banhang/src/editions/catalog.js     plain data: ids, slugs, product names, appIds (node + vite)
banhang/src/customers/<id>/  customer modules (index.js = defineCustomer(...))
banhang/src/customers/catalog.js    plain data: { id: { edition, slug, productName } }
banhang/scripts/buildTarget.mjs     resolves edition/customer → build identity (JSON)
banhang-backend/src/editions/<id>/index.js   defineBackendModule(...)
banhang-backend/src/customers/<id>/index.js
banhang-backend/src/platform/       backend module loader
```

## Module contract (frontend)

```js
defineEdition({
  id, config: { name, tagline, appTitle, defaultShopName, invoiceTagline, features, labels },
  routes: [{ path, page }], homeTiles: [{ module, label, tone, to | action }],
  slots: { 'sales.itemsTable': Component, ... },
});
defineCustomer({ id, extends: '<editionId>', config, routes, homeTiles, hideModules, slots });
```

`composeModules(core, edition, customer)`:
- `config`: deep merge (plain objects merged, arrays/scalars replaced), later wins.
- `routes`, `homeTiles`: concatenated; `hideModules` removes tiles/routes by module key.
- `slots`: override by name.
- Validation errors are thrown at compose time with the offending module id.

## Extension points (initial)

| Kind | Name | Used by |
| --- | --- | --- |
| list | `routes` | `App.jsx` |
| list | `homeTiles` | `pages/Home.jsx` |
| component (replace) | `sales.itemsTable` | sales editor (`InvoiceEditor`) |
| component (replace) | `purchases.itemsTable` | `PurchasesScreen` |
| component (append) | `catalog.productFields` | `CatalogFormModal` |
| value (replace) | `print.itemColumns` | `utils/printItems.js` |

`<Slot name fallback {...props} />` for components; `resolveSlot(name, fallback)` for values.

## Module selection

- Vite plugin provides `virtual:banhang-modules`:
  - real build: imports the selected edition (`VITE_EDITION`, default `nhomkinh`)
    and customer (`VITE_CUSTOMER`, optional, edition derived from the customer catalog);
  - demo build: imports all editions, no customers.
  - Unknown ids or a customer/edition mismatch fail the build.
- `moduleRuntime`: `getActiveModule()` (composed), `setActiveEdition(id)` (demo only).
  Replaces 2a `editionRuntime`; `useEdition()`/`useEditionFeature()` keep working on top of it.

## Backend

- `defineBackendModule({ id, routers: [[prefix, router]] })`; models/services live in
  the module folder and follow the same mongoose subset as core.
- `loadBackendModules({ edition, customer })` imports `editions/<id>` and
  `customers/<id>` dynamically from `BANHANG_EDITION` / `BANHANG_CUSTOMER`
  (default `nhomkinh`). Missing folders for unselected modules are fine.
- `mountApiRoutes(app, { modules })` mounts core routes then module routers.
- Demo mounts every edition backend module via `import.meta.glob`.
- `backendCompat.test.js` scans `editions/` and `customers/` too.

## Installer pipeline (Windows)

- `build-release.ps1 [-Edition id] [-Customer id]` → `node banhang/scripts/buildTarget.mjs`
  → env for Vite, electron-builder overrides (`productName`, `appId`), backend stage
  prunes unselected `editions/*` and `customers/*`, `.env` gets `BANHANG_EDITION`/`BANHANG_CUSTOMER`.
- `BanHang.iss` accepts `/DSlug=… /DAppName=… /DAppGuid=…`; output
  `BanHang-<Slug>-Setup-<ver>.exe`; defaults equal today's values.
- PowerShell/Inno parts cannot run on the macOS dev machine; they are reviewed
  statically and must be run once on Windows.

## Example customer

`customers/example` extends `nhomkinh`: overrides `appTitle`, adds a home tile.
Proves the mechanism end to end and is the copy template for real customers.

## Testing

- Unit: compose rules, define validation, catalogs/buildTarget resolution,
  resolveSlot, backend loader, mountApiRoutes with modules.
- Boundary guard (FE + BE): core never imports editions/customers; editions import
  only core/platform; customers import only core/platform/their edition.
- Bundle checks: `VITE_EDITION=pharmacy` dist has no other edition strings;
  demo dist has all editions and no customer strings; `VITE_CUSTOMER=example` builds.
- Browser: demo edition switching unchanged; pharmacy build opens straight into the app.
- Existing suites (FE, BE, demo contract) stay green.

## Docs

`src/platform/README.md`, `src/editions/README.md`, `src/customers/README.md`,
`packaging/windows/README.md`, backend README, `CLAUDE.md`, `AGENT.md`.

## Out of scope

Real industry features (lot/expiry, size/colour variants, unit conversion);
licensing; auto-update.
