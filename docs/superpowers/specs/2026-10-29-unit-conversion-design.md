# Unit Conversion (thùng / lốc / chai) — Design

Date: 2026-10-29 · Status: implemented · Branch: `feat/minimart-units-barcode`

## Goal

Let a minimart buy and sell one product in several packaging units (1 thùng = 24 chai,
1 lốc = 6 chai) while stock and cost stay in one base unit. This is phase 1 of the
minimart track; barcodes, printing and the quick POS build on it.

## Minimart track (context for later specs)

| Phase | Scope | Depends on |
| --- | --- | --- |
| 1 (this spec) | Unit conversion: product units, unit choice on sale/purchase lines, stock/cost/profit/report/e-invoice in base units | — |
| 2 | Barcode per unit, `GET` lookup, `useBarcodeScanner` (keystroke timing + Enter), scan in sales and purchases, unit switch on a line, unknown-code quick create | 1 |
| 3 | Printing: settings section "Máy in & tem" stored in backend `Settings` (single-machine install), receipt printer 58mm (auto height), label printer (size, columns, gap, offsets, content), Electron `deviceName` + `list-printers`, auto label print after saving a purchase with a confirm list, internal EAN-13 prefix `29` for products without a code | 1 (label count/price per unit) |
| 4 | Minimart quick POS route `/pos` in `editions/minimart`, walk-in customer, cash/change, auto 58mm receipt | 2, 3 |

## Decisions

- **Stock, `openingStock`, `avgCost`, `costPriceSnapshot` and low-stock threshold stay in the
  base unit** (`Product.unit`). Packaging units are views over it; no "unpack carton" operation.
- A line stores what was sold/bought: `qty` and `unitPrice`/`unitCost` **in the chosen unit**,
  plus a snapshot `unitName` and `factor`. Base quantity = `qty × factor`.
- `factor` missing → 1. Existing data and editions without units behave exactly as today; no
  data migration.
- The factor is snapshotted on the line, so changing a product's units later never rewrites
  history.
- One shared helper per side computes base quantity; every stock/cost consumer uses it instead
  of reading `item.qty` directly.
- Units are core (edition-agnostic). UI is shown only when the edition flag `units` is on:
  minimart `true`, every other edition `false`. Units UI is hidden when `dimensions` is on (the
  two are not combined).

## Data

| Where | Field | Notes |
| --- | --- | --- |
| Product | `units: [{ name, factor, sellPrice }]` | default `[]`; base unit is `unit` and is not listed |
| Invoice item | `unitName`, `factor` | missing → base unit, 1 |
| Purchase item | `unitName`, `factor` | missing → base unit, 1 |

Product unit rules (backend validation on create/update/bulk, `400` on violation):
- `name` non-empty, trimmed, unique within the product (case-insensitive), not equal to `unit`.
- `factor` finite number > 1.
- `sellPrice` ≥ 0 or empty. Empty → `factor × sellPriceDefault` when selling.
- At most 5 units per product.

Line rules (backend, on invoice/purchase create and update):
- `unitName` empty or equal to the product's base unit → the line carries no `unitName`/`factor`
  (same shape as lines saved before units existed, so exported e-invoices are not flagged).
- `unitName` set, `factor` set → kept (snapshot; allows editing old lines after the product
  changed).
- `unitName` set, `factor` missing → resolved from `product.units`; unknown unit → `400`.
- `factor` must be finite and > 0.

## Pricing (pure helpers, FE)

- Sell price of a unit: `unit.sellPrice` if set, else `factor × sellPriceDefault`.
- Purchase price suggestion of a unit: `factor × avgCost`.
- `costPriceSnapshot` stays base-unit `avgCost` (unchanged).
- Line amount stays `qty × price` (× area for dimension lines): price is per chosen unit.
- "Previous price for this customer" is keyed by customer + product + unit name.

## Backend changes

New `banhang-backend/src/utils/productUnits.js` (pure):
`getItemFactor(item)`, `getBaseQty(item)`, `resolveLineUnit(item, product)`,
`normalizeProductUnits(units, baseUnit)` (returns `{ units, error }`).

Base quantity replaces `item.qty` in:
- `services/stockSnapshot.service.js` `buildQtyMapFromItems` (all stock deltas: invoice
  create/update/delete, purchase, purchase delete via `crud.service.js`).
- `utils/purchaseHelpers.js` `buildQtyMapFromItems`, `buildQtyMapFromPurchases`,
  `buildQtyMapFromInvoices`.
- `utils/stock.js` `computeStock`.
- `modules/dataUpgrade/services/dataUpgrade.service.js` `buildStockSnapshot`.
- `modules/purchases/services/purchases.service.js`: `createPurchase` and `updatePurchase`
  qty/stock maps; `buildCostMapFromItems` keeps `value = qty × unitCost` with base qty, so
  avgCost per base unit = value / base qty; `computeAvgCost` is fed base qty and
  `unitCost / factor`.
- `utils/reportHelpers.js` `getInvoiceItemCostTotal` (base qty × base cost × area).
- `modules/reports/services/reportInventory.service.js` `getStockMovementReport`.
- `seedData.js` stock rebuild.

Line normalization (`resolveLineUnit`) runs where items are saved:
- invoices: `modules/invoices/services/invoices.service.js` create/update before stock deltas.
- purchases: `utils/purchaseHelpers.js` `sanitizePurchaseItems` keeps `unitName`/`factor`
  (it whitelists fields today), then resolution in the purchase service.

Product validation: `services/crud.service.js` create/bulk/update call
`normalizeProductUnits` for `Product`.

Display data:
- `utils/reportHelpers.js` `buildInvoiceItems`: `unit = item.unitName || product.unit`,
  `qty` (chosen unit) and new `baseQty`.
- `purchases.service.js` `getRecentPurchases` export `DVT` from `unitName`; `qtySum` stays the
  sum of line qty (mixed units are acceptable in a list total) — documented in the module.
- E-invoice `domain/lineMapper.js`: unit = `item.unitName || product.unit`; qty and unit price
  stay per chosen unit (qty × price = amount holds).
- E-invoice `domain/contentChange.js` `LINE_FIELDS` += `unitName`, `factor`, and the FE mirror
  `features/einvoice/domain/contentChange.js` (parity test).

Models: `Product.units` sub-schema; `unitName: String`, `factor: Number` on
`InvoiceItemSchema` and `PurchaseItemSchema`.

## Frontend changes

- `src/utils/productUnits.js` (pure): `getUnitOptions(product)` (base first),
  `getUnitSellPrice(product, unitName)`, `getUnitCostPrice(product, unitName)`,
  `formatStockByUnits(product)` (e.g. "5 thùng 3 chai", largest unit first).
  Parity test with backend `getBaseQty` semantics.
- Catalog: `pages/Catalog/ProductUnitsField.jsx` (Form.List: name, factor, sell price) rendered
  in `CatalogFormModal` when `units` is on; payload builders (`useCatalogForm.js`,
  `features/sales/domain/salesDomain.js` `buildProductPayload`) already spread form values,
  so `units` is sent. Catalog ĐVT column shows `formatUnitsSummary` ("lon (lốc 6, thùng 24)").
- Product modal (sales and purchases, `InvoiceProductModal` / `ProductInfoPanel`): unit
  selector (hidden when the product has no units). Changing the unit sets the price from the
  helpers. Stock line shows base stock plus `formatStockByUnits`.
- Line building: `invoiceItemHandlers.js` `createConfirmAddHandler` and
  `pages/Purchases/usePurchaseProductModal.js` `handleConfirmAdd` add `unitName`, `factor`
  only for a packaging unit. Same product in two units = two lines (adding always appends a
  line, as today).
- Payloads keep the fields: `components/invoice/invoicePayload.js`,
  `features/purchases/domain/purchasesDomain.js` `normalizeItem`/`buildPurchasePayload`.
- Display `item.unitName || product.unit`: `InvoiceItemRow.jsx`, `utils/printItems.js`
  `buildPrintRows`, `PurchaseDetailModal.jsx`, `SalesRecent.jsx`, `SalesHistory.jsx`,
  report invoice modals and details tables, `reportPurchaseUtils.js`.
- `pages/Reports/ReportStockOutTab.jsx` sums `baseQty` (fallback `qty`).
- `utils/searchText.js` and `catalogUtils.js` search text: flatten `units[].name` instead of
  `[object Object]`.
- Edition flag `units` added to every edition (`minimart: true`, others `false`), the shape test
  `platform/__tests__/editions.test.js` and the flag table in `editions/README.md`.

## Demo

- Minimart seed: drinks and instant noodles get units (e.g. lon → lốc 6, thùng 24; gói →
  thùng 30). Some seeded purchases are bought in thùng, some sales sold in lốc/thùng.
- `seed/buildMasterData.js` `toProduct` accepts an optional units column; `stockTracker` and
  `seedContract.test.js` use base quantity.
- Bump `SCHEMA_VERSION` in `demo/config.js`.
- No new query operators: units are read from loaded products, never queried by path.

## Error handling

- Invalid product units → `400` with a Vietnamese message naming the field; the form shows it.
- Unknown line unit → `400` "Đơn vị <x> không có trong hàng <y>".
- Negative-stock check (`allowNegativeStock` off) compares base quantities, so selling
  1 thùng with 20 chai in stock is rejected.

## Testing

Backend (vitest): `productUnits` helpers; stock deltas with factor (create/update/delete,
purchase, purchase delete); `computeStock`; `buildStockSnapshot`; avgCost after buying in
thùng and after editing such a purchase; profit cost with factor; `mapLine` unit;
`normalizeProductUnits` via crud create/update; `sanitizePurchaseItems` keeps fields; old data
without `factor` unchanged.

Frontend (vitest): `productUnits` helpers; line built with unit and price; payloads keep
`unitName`/`factor`; `printItems` unit; einvoice `contentChange` parity; editions shape test.

Demo: `seedContract` (stock = opening + Σ purchase base qty − Σ sale base qty),
`backendCompat`.

## Out of scope

Barcodes and scanning (phase 2), printing (phase 3), POS (phase 4), switching unit on an
existing line (phase 2), units in product Excel import/export, per-unit wholesale price,
units on dimension (length × width) lines.
