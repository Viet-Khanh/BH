# Barcode Scanning — Design

Date: 2026-10-29 · Status: implemented · Branch: `feat/minimart-units-barcode`

Phase 2 of the minimart track (phase 1: `2026-10-29-unit-conversion-design.md`).

## Goal

A cashier scans a product with a USB barcode scanner (keyboard wedge: types the code + Enter)
and the line lands in the sale or purchase at once, in the scanned unit, at that unit's price.
Scanning the same product+unit again adds 1 to that line.

## Decisions (agreed)

- One barcode per unit: `Product.barcode` (base unit) and `units[].barcode` (packaging units).
  Unique across all active products and units.
- Scanning again → qty + 1 on the existing line with the same product and unit (lines with
  length × width never merge).
- Scanning the base-unit code of a product that has cartons → base unit, no prompt. The cashier
  changes the unit on the line (unit select in the table, or F4 on the last line).
- No dedicated lookup endpoint: the existing product search (`GET /api/sales/products?search=`)
  also matches `barcode` and `units.barcode`; the frontend picks the exact match
  (barcode first, then product `code`). The search result is merged into the screen's product
  list as today, so the new line shows its name.
- Unknown code → error beep + warning "Mã <x> chưa có trong danh mục." (quick-create with the
  code prefilled is out of scope).
- Edition flag `barcode` (minimart `true`, others `false`) gates scanning, the barcode fields in
  the catalog and the search input on the sales screen.

## Data and backend

| Where | Field | Notes |
| --- | --- | --- |
| Product | `barcode: String` | trimmed; empty → not stored |
| Product unit | `barcode: String` | in `ProductUnitSchema`, normalized by `normalizeProductUnits` |

- Product create/bulk/update (`crud.service.js`): collect the product's codes (`barcode` +
  `units[].barcode`). Duplicate inside the product → 400 `Mã vạch <x> bị trùng trong cùng
  hàng.`; used by another active product → 400 `Mã vạch <x> đã dùng cho hàng <tên>.` Bulk create
  also checks duplicates inside the payload.
- Product search filter (`modules/sales/services/sales.service.js` `buildProductSearchFilter`)
  adds `barcode` and `units.barcode`. A single-term search also fetches exact matches
  (`barcode`, `units.barcode`, `code` equal to the term) and puts them first (deduped), so the
  row limit can never drop the scanned product.
- The demo shim must support the dotted array path `units.barcode` (regex and `$in`); covered by
  a demo test.

## Frontend

Pure helpers (`src/utils/barcodeLines.js`, tested):
- `findBarcodeMatch(products, code)` → `{ product, unitName }` or `null` (barcode/unit barcode
  first, then `code`; trimmed exact match).
- `mergeScannedLine(items, line, priceField)` → items with qty + 1 on the same product+unit line
  (no dimensions), else the line appended; line totals recomputed with `getLineAmount`.
- `switchLineUnit(item, product, unitName, price, priceField)` → line with the new unit fields,
  price and total; qty kept.
- `nextUnitName(product, unitName)` → the next unit in `getUnitOptions` order (wraps).

Line builders shared by the product modal and scanning:
- `buildSaleLine({ product, qty, unitPrice, dimensions, unit })` in
  `components/invoice/invoiceItemHandlers.js`.
- `buildPurchaseLine({ product, qty, unitCost, dimensions, unit })` in
  `features/purchases/domain/purchasesDomain.js`.

Scanner:
- `src/utils/scanBuffer.js` (pure, tested): keystrokes closer than 40 ms form a burst; Enter
  ends it; a burst is a scan when it has at least 4 printable ASCII characters, no editing key
  (Backspace, arrows…) and Enter follows quickly. IME bursts (Unikey/OpenKey Telex corrections:
  Backspace + 'ễ' within 1 ms) are therefore never scans.
- `src/features/barcode/scanKeyHandler.js` (pure, tested): the keydown logic. Character keys are
  never blocked. When a burst starts it remembers the focused field and its value; on a
  recognised scan it swallows only the closing Enter, puts the field value back and calls
  `onScan(code)`. Ignores key repeat, IME composition (`isComposing`, keyCode 229) and keys with
  Ctrl/Alt/Meta. Inactive while an Ant Design modal is open (the scanner then types into the
  modal's field like a keyboard).
- `src/features/barcode/useBarcodeScanner.js`: thin glue — window `keydown` in capture phase,
  DOM helpers from `barcodeDom.js` (`isModalOpen`, focused-field snapshot/restore).
- `src/utils/beep.js`: short Web Audio beep (`ok` / `error`), silent when audio is unavailable.

`src/features/barcode/useBarcodeLines.js` (shared by sales and purchases):
`{ enabled, unitsEnabled, items, setItems, products, searchProducts, priceField, getUnitPrice,
buildLine }` (`products` = the list the items table shows, deleted included; only active ones
match a scan) →
- registers the scanner when `enabled`; on a code: `searchProducts(code, { throwOnError: true })`
  → `findBarcodeMatch` → build the line (qty 1, unit price of the scanned unit) →
  `mergeScannedLine` → ok beep; miss → error beep + warning; search failure → error beep + the
  real error message;
- `addByCode(code)` → same, returns `true` when a product matched (used by the search input's
  Enter so typed codes work without a scanner). Calls run through a promise queue
  (`utils/taskQueue.js`) so lines are appended in scan order;
- `changeItemUnit(index, unitName)` → `switchLineUnit` with `getUnitPrice`, looking the product
  up in `products` (same list as the table, so the select never silently reverts);
- F4 when `unitsEnabled` → `changeItemUnit(last line, nextUnitName(...))`; ignored while a modal
  is open or with Ctrl/Alt/Meta (Alt+F4). Decision in `unitSwitchKey.js` (pure, tested).

Screens:
- Sales (`InvoiceEditor` stack): search input shown when `barcode` is on; Enter tries
  `addByCode` first, then the existing quick add. Price = `getUnitSellPrice` for packaging units,
  `getProductPrice` for the base unit.
- Purchases: same with `getUnitCostPrice` and the same scan placeholder; disabled (scanning and
  F4) when the purchase is read-only.
- Items table (`InvoiceItemsTable` / `InvoiceItemRow`): the ĐVT cell becomes a select of the
  product's units when an `onChangeUnit` prop is given, the product has packaging units and the
  table is not read-only.
- `searchProducts` of both screens (`useSalesCatalog`, `usePurchasesCatalog`) return the fetched
  products. The screens wrap them with `utils/guardProductSearch.js`: typing searches show
  "Không thể tải danh sách sản phẩm." and get `[]`; `{ throwOnError: true }` (scans) rejects with
  the real error.
- Catalog: "Mã vạch" field next to "Mã hàng" and a barcode column in the units editor, shown when
  `barcode` is on.

## Demo

Minimart sample products get EAN-13 barcodes (prefix `893`, valid check digit) for the base unit
and for each packaging unit; `SCHEMA_VERSION` bumps to 3.

## Testing

Backend: unit barcode normalization; duplicate barcode within a product, across products, inside a
bulk payload; search by barcode and unit barcode. Demo: `units.barcode` dotted-path queries.
Frontend: `findBarcodeMatch`, `mergeScannedLine`, `switchLineUnit`, `nextUnitName`, scan buffer,
`buildSaleLine`/`buildPurchaseLine`, edition shape test.

## Out of scope

Quick-create from an unknown code, several barcodes per unit, weighed-item (prefix 2x) codes,
label printing (phase 3), the quick POS screen (phase 4), barcodes in product Excel import/export.
