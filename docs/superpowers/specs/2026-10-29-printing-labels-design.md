# Printing: Receipt Printer and Labels — Design

Date: 2026-10-29 · Status: implemented · Branch: `feat/minimart-units-barcode`

Phase 3 of the minimart track (phase 1 units, phase 2 barcode scanning).

## Goal

A minimart has two printers on its single machine (frontend + backend + local database together):
a 58 mm receipt printer and a label printer. Sales receipts go to the receipt printer in a
58 mm layout; after saving a purchase the app prints price/barcode labels on the label printer so
staff can stick them on the goods. Everything is configured in the System page.

## Decisions (agreed with the user)

- Printer setup lives in the System page, section "Máy in & tem", stored in backend `Settings`
  (one machine, so printer names are safe to store centrally; restore on another machine falls
  back to the default printer with a warning).
- Two printers: receipt (paper 58 mm) and label (size configurable).
- Label barcode: the unit's own barcode; for the base unit the product barcode, and when the
  product has none, the product **code** (`Mã hàng`) in Code128. Scanning that label already
  works because barcode lookup falls back to `code` (phase 2).
- A packaging unit (thùng/lốc) without its own barcode gets a label with price but **no
  barcode** (the product code would scan as the base unit); the confirm list warns about it.
- After saving a new purchase the label confirm list opens automatically (setting, default on);
  Enter prints. Editing a purchase never auto-prints; labels can be reprinted from the purchase
  detail and from the catalog.
- Silent printing to a chosen printer only in Electron; the web build shows the print dialog.
- JsBarcode (`jsbarcode`) renders EAN-13 / Code128 as SVG (mature library; no hand-written
  symbology tables).

## Settings (backend `Settings`, defaults in `store/settingsDefaults.js`)

| Field | Default | Notes |
| --- | --- | --- |
| `receiptPaper` | `'auto'` | `'auto'` (today's A5/A4) or `'58mm'` |
| `receiptPrinterName` | `''` | empty = system default printer |
| `labelPrinterName` | `''` | |
| `labelWidthMm`, `labelHeightMm` | 35, 22 | presets: 35×22 (2 per row), 40×30, 50×30 |
| `labelColumns`, `labelGapMm` | 2, 2 | labels per row, gap between them |
| `labelOffsetXMm`, `labelOffsetYMm` | 0, 0 | fine alignment |
| `labelShowShopName`, `labelShowPrice` | true, true | name and barcode always printed |
| `autoPrintLabelsOnPurchase` | true | effective only when the edition flag `labels` is on |

Edition flag `labels`: minimart `true`, others `false`. It gates the label settings, the
post-purchase label list and the label buttons.

## Printing infrastructure

- Electron `print-html` accepts `deviceName` and a custom page size `{ widthMm, heightMm }`
  (converted to microns). If `deviceName` is not installed it prints on the default printer and
  returns `{ ok: true, fallback: true }`.
- New IPC `list-printers` → `[{ name, displayName, isDefault }]`; preload exposes
  `listPrinters()`.
- `utils/printUtils.js` `printHtml(html, { deviceName, pageSizeMm, … })` passes them through;
  the web path keeps `window.print()`. A fallback shows "Không tìm thấy máy in '<x>', đã in ra
  máy mặc định." Keep the file ≤ 200 lines (move page-size helpers into `utils/printPageSize.js`).

## Receipt 58 mm

- `features/printing/receipt58.js` (pure): HTML for 58 mm paper (printable ≈ 48 mm, ~32 chars):
  shop name/phone/address, code + date/time, customer if not walk-in, each item as name line +
  `qty unit × price = amount` line, total, paid, change/debt, note, thank-you line. Uses the line
  unit (`getItemUnitName`). Font/size chosen for 58 mm.
- When `receiptPaper === '58mm'`, the sales print (`useInvoicePreview.handlePrint`) uses this
  template, `deviceName: receiptPrinterName`, width 58 mm and height measured from the content
  (existing measuring helper, generalized). Otherwise today's behaviour.

## Labels

- `features/printing/labels/buildLabelJobs.js` (pure): purchase lines + products → rows
  `{ productId, unitName, count, barcode, barcodeFormat, price, warning }`:
  default unit = base unit, count = base quantity of all lines of that product; price = unit sell
  price; barcode per the rule above; format `EAN13` for valid 13-digit EAN, else `CODE128`;
  `skipWithBarcode` option (default on) drops rows whose unit already has a manufacturer barcode
  (only products without a barcode need a sticker).
- `features/printing/labels/labelHtml.js` (pure except the injected SVG renderer): page = one
  row of `labelColumns` labels; each label sized in mm with offsets; content per settings; text
  truncated to fit.
- `features/printing/labels/barcodeSvg.js`: JsBarcode → SVG string (browser only; tests mock it).
- `LabelPrintModal` (confirm list): rows with unit select, count input (+/−), warning tag;
  "Bỏ qua hàng đã có mã vạch" switch; total labels; "In (Enter)" / "Bỏ qua". Prints with
  `deviceName: labelPrinterName`, page size `columns × width + gaps` by `height`.
- Entry points: after `createPurchase` succeeds (flag on + setting on); "In tem" in the purchase
  detail modal; "In tem" row action in the catalog (count 1, base unit).

## Settings UI

`features/printing/components/PrintSettingsSection.jsx` (own form, like the e-invoice section):
receipt printer + paper; label printer + preset/size/columns/gap/offsets/content/auto-print
(label part only when `labels` is on); printer selects filled from `listPrinters()` in Electron,
disabled with a hint on the web; "In thử" buttons for receipt and label.

## Testing

Pure: page-size conversion, receipt58 HTML (units, totals, walk-in), buildLabelJobs (counts in
base units, unit switch, barcode fallback rules, skip option, warnings), labelHtml layout (rows,
sizes, offsets) with a fake SVG renderer, settings form mapping. Electron and printing glue are
not unit-tested.

## Out of scope

Raw TSPL/ZPL/ESC-POS printing, cash drawer kick (use the printer driver option), editable
receipt template, the quick POS screen (phase 4), weighed-item codes.
