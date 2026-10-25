# Customers (`src/customers`)

A customer module tailors one edition for one customer. Most customers need only config
(title, labels, flags); some need code (screens, components, API). Read
`../platform/README.md` first.

- `<id>/index.js` — `defineCustomer({ id, extends: '<edition>', config, routes?, homeTiles?, hideModules?, slots? })`.
  Declare **only what differs** from the edition.
- `catalog.js` — plain data: `edition` (parent) and installer identity. Never change
  `installerGuid` after an installer has shipped.
- Backend part (optional): `banhang-backend/src/customers/<id>/index.js` (`defineBackendModule`,
  routes under `/api/<id>/…`).
- Customer code is **never** bundled into the public web demo or other builds.
- Imports allowed: core, `platform/`, this folder, the parent edition folder (boundary test).

`example/` is a working template (extends `nhomkinh`): overrides the title, adds a home tile and
a page; its backend module exposes `GET /api/example/ping`.

## Add a customer

1. Copy `example/` to `<id>/`, set `id` and `extends`, keep only the changes you need.
2. Add `<id>` to `catalog.js` (edition, `productName`, `appId`, new random `installerGuid`,
   `installerBaseName`).
3. Optional backend: copy `banhang-backend/src/customers/example/` to `<id>/`.
4. Build and verify:
   ```bash
   VITE_CUSTOMER=<id> npm run build          # web check
   npm run verify:bundles                    # isolation checks
   # Windows installer: packaging\windows\scripts\build-release.ps1 -Customer <id>
   ```
