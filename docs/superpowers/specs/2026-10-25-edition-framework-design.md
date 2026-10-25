# Edition Framework (2a) — Design

Date: 2026-10-25 · Status: approved · Sub-project 2a of the productization roadmap

## Goal

One codebase serves several retail industries ("editions"). Each edition changes
UI only: dimension columns, home modules, field labels, titles, default invoice
tagline and sample-data tooling. No database or backend change.

## Decisions

- Editions: `nhomkinh` (default, today's app, unchanged behaviour), `vlxd`,
  `minimart`, `fashion`, `pharmacy`.
- Real product: edition fixed at build time with `VITE_EDITION` (default
  `nhomkinh`). An unknown id fails the build.
- Demo: edition chosen at runtime by the demo session (page reloads on switch).
- Industry-specific data (lot/expiry, size/colour variants, unit conversion) is
  out of scope; it belongs to industry packs (2b+).

## Edition config

`banhang/src/editions/<id>.js`:

```js
{
  id, name, tagline,            // picker / docs
  appTitle,                     // header + document.title
  defaultShopName,              // settings default
  invoiceTagline,               // line under shop name in default invoice template
  features: { dimensions, sampleData },
  modules: ['system','catalog','sales','purchases','cashbook','reports'],
  labels: { group, spec },
}
```

| | nhomkinh | vlxd | minimart | fashion | pharmacy |
| --- | --- | --- | --- | --- | --- |
| dimensions | on | on | off | off | off |
| sampleData (backend /api/seed) | on | off | off | off | off |
| labels.group | Nhóm hàng | Nhóm hàng | Ngành hàng | Danh mục | Nhóm thuốc |
| labels.spec | Quy cách | Quy cách | Quy cách | Size / màu | Quy cách đóng gói |
| modules | all 6 | all 6 | all 6 | all 6 | all 6 |

`nhomkinh` keeps today's title, shop name and invoice tagline verbatim.

## Runtime

- `editions/index.js`: registry, `getEditionConfig(id)`, `DEFAULT_EDITION_ID`.
- `editions/editionIds.js`: id list only (imported by `vite.config.js` for validation).
- `editions/editionRuntime.js`: `getEdition()`, `setEdition(id)`. Initial value =
  `import.meta.env.VITE_EDITION || 'nhomkinh'`. Demo calls `setEdition` before
  rendering `<App/>`. `applyEditionToDocument()` sets `document.title`.
- `editions/useEdition.js`: `useEdition()`, `useEditionFeature(name)`.
- Values that depend on the edition are computed lazily (functions, not module
  constants): `getDefaultSettings()`, `buildDefaultTemplate()`. Module constants
  would be evaluated before the demo sets the edition.

## Dimensions (Dài / Rộng / m²)

- New `utils/lineMeasure.js`: `hasDimensions`, `getAreaMultiplier`,
  `getMeasuredQty`, `normalizeDimension`. Replaces the copies in
  `invoiceUtils`, `invoiceItemHandlers`, `purchasesDomain`, `reportItemMeasure`,
  `reportSalesUtils`, `computeProfitByDay`, `renderTemplate`, `InvoiceItemsTable`.
- Formulas stay edition-agnostic: without length/width the multiplier is 1.
- UI reads `useEditionFeature('dimensions')`:
  - `InvoiceItemsTable`, `InvoiceProductModal` (prop default),
  - `PurchaseDetailModal`, `ReportSalesInvoiceModal`, `ReportPurchaseInvoiceModal`
    via shared `MeasureHeaderCells` / `MeasureCells` components,
  - print: `printItemColumns.js` builds the `{{items}}` table columns from the flag.

## Refactors (clean code, logic separated from UI)

- `components/invoice/InvoiceItemsTable.jsx` (322 lines) →
  `components/invoice/itemsTable/`: `EditableNumberCell.jsx`,
  `EditableTextCell.jsx`, `useCellEditing.js`, `itemColumns.js` (pure column
  list), `InvoiceItemRow.jsx`, `InvoiceItemsTable.jsx` (composition).
- `components/invoice/InvoiceProductModal.jsx` (318 lines) → hooks
  `useProductModalFocus.js`, `useDebouncedProductSearch.js`,
  `useQuickCreateProduct.js` + `ProductInfoPanel.jsx` + composition.
- `utils/renderTemplate.js` (211 lines) → columns moved to `utils/printItemColumns.js`.
- `pages/Home.jsx` tiles → `pages/homeTiles.js` config filtered by `modules`.
- Delete unused `pages/Purchases/{PurchaseItemsTable,PurchaseSearchModal,
  PurchaseTopSection,PurchaseHeader}.jsx`, `usePurchasesLogic.js`,
  `usePurchaseFilters.js` (verified: not imported anywhere).
- Remove `constants/app.js` (`DEFAULT_APP_TITLE`) — title comes from the edition.

## Other UI changes

- Catalog product form gains `group` and `spec` fields labelled by `labels`.
- System page shows "Dữ liệu mẫu" only when `features.sampleData`.
- `index.html` `<title>` becomes neutral ("Phần mềm bán hàng"); runtime sets the edition title.

## Demo integration

- `src/demo/editions/<id>/index.js` keeps seed data only (`seed, codePrefix,
  shop, units, products, customers, suppliers, expenses, activity`). Display
  fields come from `src/editions`. Demo `EDITIONS` = config + seed merged.
- New demo edition `nhomkinh` (aluminium/glass/steel sample data).
- `DemoGate` calls `setEdition()` + `applyEditionToDocument()` before rendering;
  no more `title` prop cloning.

## Build

- `VITE_EDITION=<id> npm run build` / `npm run build:electron`; Vercel demo build
  ignores it (runtime choice).
- `vite.config.js` throws for an unknown `VITE_EDITION`.

## Testing

- Unit: edition registry shape, runtime get/set, `lineMeasure`, `itemColumns`,
  `printItemColumns` + `buildItemsHtml` with dimensions on/off, lazy default
  settings/template per edition.
- Existing tests keep passing (renderTemplate tests use nhomkinh defaults).
- Demo: editions test covers 5 editions; contract test seeds `nhomkinh` too.
- Browser smoke: pharmacy sales screen has no "Dài" column; nhomkinh has it;
  print preview columns follow the flag.
- `npm run build` with `VITE_EDITION=pharmacy` succeeds; `VITE_EDITION=nope` fails.
