# Platform (`src/platform`) — module system

One **core** app; **edition** modules (one per industry) and **customer** modules
(one per customer that needs changes) add to or replace parts of it without editing core.

Spec: `docs/superpowers/specs/2026-10-25-module-architecture-design.md`.

```
core      = everything in src/ except platform/, editions/, customers/, demo/
platform  = this folder: define / compose / runtime / slots (owned by core)
editions/<id>/   edition modules        customers/<id>/   customer modules
banhang-backend/src/{editions,customers}/<id>/   backend parts of the same modules
```

Merge order: **core defaults ← edition ← customer** (later wins).

## Module contract

```js
// src/editions/<id>/index.js
export default defineEdition({
  id: 'pharmacy',
  config: { name, tagline, appTitle, defaultShopName, invoiceTagline,
            features: { dimensions, sampleData, units, barcode, labels, sequentialCodes },
            labels: { group, spec } },
  routes: [{ module: 'expiry', path: '/expiry', page: ExpiryPage }],   // optional
  homeTiles: [{ module: 'expiry', label: 'HẠN DÙNG', to: '/expiry' }],  // optional
  hideModules: ['cashbook'],                                           // optional
  slots: { 'sales.itemsTable': PharmacyItemsTable },                    // optional
});

// src/customers/<id>/index.js — declares only what differs from its edition
export default defineCustomer({ id: 'ankhang', extends: 'pharmacy', config: { appTitle: '…' } });
```

`composeModules(edition, customer)`:

- `config` — deep merge of plain objects; arrays/scalars replaced.
- `routes`, `homeTiles` — concatenated; entries whose `module` is in `hideModules` removed.
  Core home tiles (`pages/homeTiles.js`) can also be hidden by module key.
- `slots` — replaced by name.

`defineEdition` / `defineCustomer` throw on unknown keys, unknown slot names, routes
without `path`/`page`, tiles without `module`/`label`, customers without `extends`.

## Extension points (slots)

| Name                    | Kind                     | Core call site                                  | Props / signature                                          |
| ----------------------- | ------------------------ | ----------------------------------------------- | ---------------------------------------------------------- |
| `sales.itemsTable`      | component, replace       | `components/InvoiceEditor.jsx`                  | same props as `InvoiceItemsTable`                          |
| `purchases.itemsTable`  | component, replace       | `features/purchases/screen/PurchasesScreen.jsx` | same props as `InvoiceItemsTable`                          |
| `catalog.productFields` | component, fallback none | `pages/Catalog/CatalogFormModal.jsx`            | `{ form, labels }` — render extra `Form.Item`s             |
| `print.itemColumns`     | value, replace           | `utils/printItems.js`                           | `({ dimensions }) => columns` like `buildPrintItemColumns` |

Plus lists: `routes` (`App.jsx`) and `homeTiles` (`pages/Home.jsx`).

Use in core: `<Slot name={SLOTS.x} fallback={CoreComponent} {...props} />` (components) or
`resolveSlot(SLOTS.x, coreFn)` (values).

### Add an extension point

1. Add the name to `SLOTS` in `slots.js`.
2. At the core call site, render `<Slot>` / call `resolveSlot` with core's implementation as fallback.
3. Add a row to the table above (props contract!) and a test if behaviour changes.

## Which modules a bundle contains

`vite/modulesPlugin.js` generates `virtual:banhang-modules`:

| Build                                               | Contains                           | Edition switch           |
| --------------------------------------------------- | ---------------------------------- | ------------------------ |
| `npm run build` (+ `VITE_EDITION`, `VITE_CUSTOMER`) | one edition (+ one customer)       | no                       |
| `npm run build:demo`                                | every edition, **never customers** | yes (`setActiveEdition`) |
| tests (`mode === 'test'`)                           | every edition                      | yes                      |

Ids come from `editions/catalog.js` / `customers/catalog.js` (plain data, also used by
`scripts/buildTarget.mjs` and Windows packaging). Unknown ids or a customer/edition
mismatch fail the build. `npm run verify:bundles` proves the isolation.

## Runtime API

| Function                                                      | Use                                                                                 |
| ------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| `useActiveModule()`                                           | React: `{ editionId, customerId, config, routes, homeTiles, hiddenModules, slots }` |
| `useEdition()`, `useEditionFeature(name)`                     | React: `config`, one feature flag                                                   |
| `getActiveModule()`, `getEditionConfig()`, `hasFeature(name)` | plain code                                                                          |
| `setActiveEdition(id)`                                        | demo/test only                                                                      |
| `applyEditionToDocument()`                                    | sets `document.title`                                                               |

## Rules

1. Core never imports `editions/<id>/` or `customers/<id>/`; platform never imports modules or demo.
2. An edition imports only core, platform and itself; a customer only core, platform, itself and its
   parent edition. Enforced by `__tests__/moduleBoundaries.test.js` (FE) and
   `banhang-backend/src/__tests__/moduleBoundaries.test.js` (BE).
3. Formulas stay edition-agnostic; flags/slots decide what is shown or which component renders.
4. Edition-dependent values are computed lazily (functions), never module-level constants.
5. Customer code never ships in the public demo.
