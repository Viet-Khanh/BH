# Editions (`src/editions`)

One codebase serves several retail industries. An **edition** changes UI only:
dimension columns, home modules, field labels, titles, the default invoice tagline
and sample-data tooling. Business logic, the database and the backend are shared.

Design spec: `docs/superpowers/specs/2026-10-25-edition-framework-design.md`.

## Editions

| id                   | Name                  | dimensions (Dài/Rộng/m²) | sampleData |
| -------------------- | --------------------- | ------------------------ | ---------- |
| `nhomkinh` (default) | Nhôm kính / Sắt       | on                       | on         |
| `vlxd`               | Vật liệu xây dựng     | on                       | off        |
| `minimart`           | Tạp hoá / Minimart    | off                      | off        |
| `fashion`            | Thời trang / Giày dép | off                      | off        |
| `pharmacy`           | Nhà thuốc             | off                      | off        |

`nhomkinh` reproduces the original app exactly (title, shop name, invoice tagline).

## Config shape (`<id>.js`)

```js
{
  id, name, tagline,        // identity, demo picker
  appTitle,                 // header + document.title
  defaultShopName,          // settings default
  invoiceTagline,           // line under shop name in the default invoice template
  features: { dimensions, sampleData },
  modules: ALL_MODULES,     // home tiles (modules.js / pages/homeTiles.js)
  labels: { group, spec },  // product field labels
}
```

## How the active edition is chosen

| Build                 | Source                                                                                           |
| --------------------- | ------------------------------------------------------------------------------------------------ |
| Real (web / Electron) | `VITE_EDITION` at build time, default `nhomkinh`. Unknown ids fail the build (`vite.config.js`). |
| Demo (`build:demo`)   | Visitor picks it; `demo/session/demoSession.js` calls `setEdition()` before `<App/>` renders.    |

```bash
VITE_EDITION=pharmacy npm run build              # web
VITE_EDITION=pharmacy npm run build:electron     # desktop installer
```

## Rules

1. **Read the edition through the runtime.** React: `useEdition()`, `useEditionFeature(name)`.
   Plain code: `getEdition()`, `hasFeature(name)`. Never import an edition file directly.
2. **Formulas stay edition-agnostic.** Only visibility depends on flags. Example: line totals use
   `utils/lineMeasure.js`; without length/width the area multiplier is 1, so no `if (edition…)`.
3. **No edition-dependent module constants.** Compute lazily (`getDefaultSettings()`,
   `buildDefaultTemplate()`): modules load before the demo sets the edition.
4. **Components take an override prop, default from the edition** (e.g. `showDimensions` on
   `InvoiceItemsTable` / `InvoiceProductModal`).
5. Industry data models (lot/expiry, size/colour variants, unit conversion) do **not** belong here;
   they are industry packs with their own backend changes.

## Where flags are read

| Flag                                | Read in                                                                                                                                                                                             |
| ----------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `features.dimensions`               | `components/invoice/itemsTable`, `components/invoice/productModal`, `components/measure/MeasureCells.jsx` (purchase detail + report modals), `utils/printItems.js`, `components/TemplateEditor.jsx` |
| `features.sampleData`               | `pages/System/System.jsx`                                                                                                                                                                           |
| `modules`                           | `pages/Home.jsx` via `pages/homeTiles.js`                                                                                                                                                           |
| `labels`                            | `pages/Catalog/CatalogFormModal.jsx`                                                                                                                                                                |
| `appTitle`                          | `App.jsx`, `applyEditionToDocument()`                                                                                                                                                               |
| `defaultShopName`, `invoiceTagline` | `store/settingsDefaults.js`, `features/settings/templates/defaultInvoiceTemplate.js`                                                                                                                |

## Recipes

### Add an edition

1. Add the id to `editionIds.js`; create `<id>.js` (copy `minimart.js`); register it in `index.js`.
2. Add demo sample data: `src/demo/editions/<id>/` (see `src/demo/README.md`) and register it in
   `src/demo/editions/index.js`.
3. `VITE_API_URL= npx vitest run` — edition, demo and contract tests cover it automatically.

### Add a feature flag

1. Add the key to `features` in **every** edition file (the shape test enforces it).
2. Read it with `useEditionFeature('<flag>')` / `hasFeature('<flag>')` at the UI boundary.
3. Add a row to the table above and a test where behaviour changes.

### Add a home module

Add the key to `modules.js` and a tile to `pages/homeTiles.js` (same order); list it in the
editions that should show it.
