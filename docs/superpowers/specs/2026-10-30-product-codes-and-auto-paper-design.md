# Sequential Product Codes and Auto A5/A4 Fix — Design

Date: 2026-10-30 · Status: approved · Branch: `feat/minimart-units-barcode`

Two small follow-ups of the minimart track, both chosen by the user.

## 1. Sequential product codes (minimart) and unique codes (all editions)

### Problem

New products get a code from the initials of their name (`buildCodeFromName`: "Coca-Cola lon
320ml" → `CL3`). Codes collide easily and nothing checks uniqueness. Since phase 3 the code is
printed as the barcode on labels of products without a manufacturer barcode, and scanning picks
the first product with that code — a collision sells the wrong product.

### Decisions

- Edition flag `sequentialCodes` (minimart `true`, others `false`). With the flag on, a new
  product's code is the next code of the form `SP` + 6 digits (`SP000001`, `SP000002`, …): the
  largest existing `SP<digits>` code + 1. Existing products keep their codes. Initials stay the
  rule for other editions.
- The backend computes the next code: `GET /api/products/next-code?prefix=SP&digits=6` →
  `{ code: 'SP000124' }` (counts all products, deleted included, so codes are never reused).
- The frontend fills the code field with it when a create form opens (catalog form and the quick
  create in the sales/purchase product modal). Typing a name no longer overwrites the code in this
  mode; the user may still type their own code.
- Product codes are unique among active products in **every** edition, checked by the backend on
  create and when an update changes the code (existing duplicates are left alone; an update that
  does not change the code is not checked). A code may also not equal another active product's
  barcode or unit barcode, and a barcode may not equal another active product's code (scanning
  falls back to `code`). Error 400: `Mã hàng <x> đã dùng cho hàng <tên>.` /
  `Mã vạch <x> trùng mã hàng của <tên>.`
- Bulk import keeps its current behaviour (skips rows whose name exists); codes duplicated inside
  one import or against existing products are rejected with the same 400 message.
- Initials editions: when the auto-generated initials code is already used by a loaded product,
  the form appends a number (`CL3` → `CL3-2`, `CL3-3`, …) before saving, so users rarely meet the
  new error. Codes the user typed are not changed.

### Scope

Backend: next-code service + route, code uniqueness in `crud.service.js` (shared helper next to
`productBarcodes.service.js`). Frontend: flag, `productsApi.getNextProductCode`, catalog form and
quick create use it, initials de-duplication helper (pure, tested). Demo: flag only (seeded codes
stay `TH001`… for the minimart demo; the next-code rule only looks at `SP` codes).

## 2. Auto A5/A4 for the normal invoice print

### Problem

`resolveAutoPageSize` measures the invoice inside an iframe 297 mm high and takes the largest of
`body`/`documentElement` heights. In standards mode `documentElement.scrollHeight` is at least the
viewport height, so the result is always A4 (pre-existing; confirmed in review).

### Fix

- Measure with a 1 mm viewport (as the 58 mm receipt already does) at the printable A5 width
  (148 mm − 2 × 10 mm template side margins = 128 mm).
- Pure decision `chooseAutoPageSize(contentHeightPx)`: A5 when the content fits
  210 mm − 2 × 8 mm template margins − a 6 mm safety allowance (= 188 mm), else A4. Tested.
- Behaviour change for all editions: short invoices now print on A5, as the setting "Tự động
  A5/A4" always promised. Mentioned in the commit message.
