# Editions (`src/editions`)

One module per retail industry. Read `../platform/README.md` first (contract, slots, runtime).

| id                   | Name                  | dimensions (Dài/Rộng/m²) | sampleData | Installer                           |
| -------------------- | --------------------- | ------------------------ | ---------- | ----------------------------------- |
| `nhomkinh` (default) | Nhôm kính / Sắt       | on                       | on         | `BanHang-Setup` (original identity) |
| `vlxd`               | Vật liệu xây dựng     | on                       | off        | `BanHang-VLXD-Setup`                |
| `minimart`           | Tạp hoá / Minimart    | off                      | off        | `BanHang-TapHoa-Setup`              |
| `fashion`            | Thời trang / Giày dép | off                      | off        | `BanHang-ThoiTrang-Setup`           |
| `pharmacy`           | Nhà thuốc             | off                      | off        | `BanHang-NhaThuoc-Setup`            |

- `<id>/index.js` — `defineEdition({ id, config, routes?, homeTiles?, hideModules?, slots? })`.
- `catalog.js` — plain data: ids (picker/build order), installer identity (`productName`,
  `appId`, `installerGuid`, `installerBaseName`). **Never change `installerGuid` after release.**
- Backend part (optional): `banhang-backend/src/editions/<id>/index.js` with `defineBackendModule`.

## Where config is read

| Key                                 | Read in                                                                                                                                                           |
| ----------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `features.dimensions`               | `components/invoice/itemsTable`, `components/invoice/productModal`, `components/measure/MeasureCells.jsx`, `utils/printItems.js`, `components/TemplateEditor.jsx` |
| `features.sampleData`               | `pages/System/System.jsx`                                                                                                                                         |
| `features.units`                    | `pages/Catalog/CatalogFormModal.jsx`, `components/invoice/productModal/InvoiceProductModal.jsx`                                                                   |
| `labels`                            | `pages/Catalog/CatalogFormModal.jsx`                                                                                                                              |
| `appTitle`                          | `App.jsx`, `applyEditionToDocument()`                                                                                                                             |
| `defaultShopName`, `invoiceTagline` | `store/settingsDefaults.js`, `features/settings/templates/defaultInvoiceTemplate.js`                                                                              |

## Build

```bash
VITE_EDITION=pharmacy npm run build              # web
VITE_EDITION=pharmacy npm run build:electron     # desktop
# Windows installer: packaging\windows\scripts\build-release.ps1 -Edition pharmacy
```

## Recipes

### Add an edition

1. Add an entry to `catalog.js` (new random `installerGuid`, unique `appId`/`productName`).
2. Create `<id>/index.js` (copy `minimart/index.js`).
3. Demo sample data: `src/demo/editions/<id>/` + register in `src/demo/editions/index.js`.
4. `VITE_API_URL= npx vitest run` and `npm run verify:bundles`.

### Add industry-specific screens or behaviour

- New screen: page component in `<id>/`, then `routes` + `homeTiles` in the edition.
- Different component for an existing spot: fill a slot (`slots: { 'sales.itemsTable': … }`).
  No slot there yet? Add one in core (`../platform/README.md` → "Add an extension point").
- New data/API: backend module in `banhang-backend/src/editions/<id>/` (own models, services,
  routers under `/api/<id>/…`), using only the mongoose subset the demo shim supports.

### Add a feature flag

1. Add the key to `config.features` in **every** edition (the shape test enforces it).
2. Read it with `useEditionFeature()` / `hasFeature()` at the UI boundary; keep formulas generic.
