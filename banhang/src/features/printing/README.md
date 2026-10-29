# Printing (`features/printing`)

Receipt printer (58 mm / 80 mm / custom roll), A4 printer and label printer for shops that run
everything on one machine. Configured in System → "In ấn" (sub-headings "Hoá đơn", "Máy in A4"
and "Tem"); values live in backend `Settings`. Label UI is gated by the edition flag `labels`
(minimart). Specs: `docs/superpowers/specs/2026-10-29-printing-labels-design.md`,
`docs/superpowers/specs/2026-10-30-receipt-designer-design.md` (roll receipt designer),
`docs/superpowers/specs/2026-10-30-printer-routing-design.md` (printer routing).

## Printer routing (`printTargets.js`)

`getPrinterFor(settings, target)` is the only place that maps a print to a printer
(`''` = system default; a missing printer → default printer + warning).

| Target     | Setting               | Documents                                                                                                                                      | Printed by                                                        |
| ---------- | --------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------- |
| `receipt`  | `receiptPrinterName`  | Sales invoice on a roll paper (58 / 80 / custom)                                                                                               | `printSalesInvoice` (format `default`)                            |
| `document` | `documentPrinterName` | Sales invoice A5/A4 template (paper "Tự động A5/A4" or one-off "In A4"), purchase invoice, debt receipts, report/list prints (`ExportActions`) | `printDocument(html, options)`; `printSalesInvoice` template path |
| `label`    | `labelPrinterName`    | Barcode labels                                                                                                                                 | `labels/printLabels.js`                                           |

- `printDocument` = `printHtml` with the stored document printer (a given `deviceName` wins, used
  by "In thử A4"); with `forceDialog` (ExportActions "PDF" / choose printer) the dialog opens
  without a preset printer.
- Sales print buttons (`SalesPrintButtons`, `domain/salesPrintButtons.js`): roll paper → "In"
  (roll receipt) + "In A4" (`format: 'a4'`, template on the document printer) in the sales
  toolbar, "Hóa đơn gần đây" ("IN LẠI" / "IN A4") and the report sales invoice modal; paper
  "Tự động A5/A4" → one button as before. "Thanh toán & In" always prints the default format.

## Flow

```
sales print / reprint ─► printSalesInvoice ─► roll paper and format ≠ 'a4'? loadReceiptAssets → buildReceiptHtml : normal template
A4/A5 documents ─► printDocument (document printer)
purchase created ─► (payment modal closed) ─► LabelPrintModal ─► printLabels ─► labelHtml + JsBarcode
                                                      ▲
            purchase detail "In tem" / catalog "In tem" ┘
all ─► utils/printUtils.printHtml({ deviceName, pageSizeMm | autoHeightWidthMm })
     ─► Electron `print-html` (temp file, silent, chosen printer; missing printer → default + warning)
     └► web: browser print dialog
```

## Roll receipt

- Paper (`receipt/receiptPaper.js`): `receiptPaper` = `auto` (A5/A4 template), `58mm` (58 mm,
  margins 5 → 48 mm printable), `80mm` (80 / 4 → 72 mm) or `custom` (`receiptWidthMm` 40–112,
  `receiptMarginMm` 0–10). Every roll paper prints `buildReceiptHtml` on `receiptPrinterName`
  with `autoHeightWidthMm` = paper width (height measured from the content).
- Layout (`Settings.receiptLayout`, `receipt/receiptLayout.js`):
  `{ fontSizePx, blocks: [{ key, on, text?, style? }] }` (font 9–16 px); order = print order. `normalizeReceiptLayout` drops unknown
  keys, appends missing ones with their default state and keeps `items`/`totals` on. Pure
  editors (`moveBlock`, `toggleBlock`, `setBlockText`, `setItemsStyle`, `setFontSize`) feed
  the designer.
- Blocks (`receipt/blocks/*.js`, `(ctx) → html`, all text escaped): logo, shop, title, meta
  (code + date), customer (hidden for walk-in), items (`twoLine` | `compact`), totals (total,
  old debt + "Tổng thanh toán", paid, "Còn nợ" / "Tiền thối"), note, qr, barcode, footer. `ctx`
  is built once (`receiptContext.js`). A dashed line separates consecutive blocks of different
  zones (head = logo + shop, info = title + meta + customer).
- Amount due = total + old debt − paid (`receiptAmounts.js`).
- VietQR (`vietqr.js`, `banks.js`, `qrSvg.js`): NAPAS 247 transfer payload (EMVCo TLV + CRC16
  CCITT-FALSE) with the amount due and the invoice code as note, from the shop bank fields
  `bankBin`, `bankAccountNo`, `bankAccountName`. Shown only when the block is on, BIN/account are
  set and something is due. Rendered locally with `qrcode-generator` (modules snapped to
  printer dots).
- Invoice barcode: Code128 of `invoice.code` via the lazy JsBarcode loader (needs a DOM).
- Async boundary: `receiptAssets.loadReceiptAssets(data)` → `{ qrSvg, barcodeSvg }` (a failing
  asset is skipped); `buildReceiptHtml(data, assets)` and `buildSalesPrintJob` stay pure/sync.
- Logo: `Settings.receiptLogo`, an image data URL (anything else is ignored).

## Receipt designer (System → In ấn → Hoá đơn)

- Printer form (`ReceiptPrintSettings` + `ReceiptPaperFields`): printer, paper (Tự động / 58 / 80 /
  Tùy chỉnh → "Chiều rộng giấy" 40–112 mm + "Lề trái/phải" 0–10 mm), copies; roll papers show
  "Vùng in ≈ N mm" (`getReceiptPaper`). Its "Lưu" never writes `receiptLayout`/`receiptLogo`
  (`omitDesignerSettings` in `domain/printSettingsForm.js`): the form may hold stale copies.
- Designer (`components/receiptDesigner/`), shown while the paper on screen is a roll paper; own
  state (`designerState.js` reducer over the `receiptLayout.js` editors, `dirty` = unsaved; follows
  the stored values while unedited) and own "Lưu thiết kế" (writes only `receiptLayout` +
  `receiptLogo`). Left: font size, blocks in print order (switch — `items`/`totals` locked — label,
  ↑/↓, text for `title`/`footer`, "2 dòng"/"Gọn" for `items`, bank hint on `qr`, logo
  pick/remove/thumbnail). Right: preview of the sample receipt (`domain/printSamples.js`) with the
  unsaved paper + designer values, debounced (`useReceiptPreviewHtml`: `loadReceiptAssets` →
  `buildReceiptHtml`), in a sandboxed `iframe` exactly `paper.widthMm` mm wide (receipt CSS stays
  isolated; height follows the content). "In thử" prints the same unsaved values on the chosen
  printer; "Khôi phục mặc định" resets the layout and keeps the logo.
- Logo (`receipt/logoImage.js`, browser only): image file → canvas `min(image width, printable mm ×
8)` px wide (ratio kept, ≤ 160 px high) → grayscale on white + threshold 128 → PNG data URL;
  non-images and results > 200 KB are rejected with a message. Pixel math in `receipt/logoPixels.js`
  (tested). Nothing is uploaded: the data URL is stored in Settings on "Lưu thiết kế".
- Bank info for the QR block: System → Cửa hàng (`components/BankSettingsFields.jsx`,
  `domain/bankSettingsForm.js`): bank select from `banks.js` or "Khác" + 6-digit BIN, account
  number, account holder.

## Label rules

- Count per product = base quantity bought (2 thùng × 24 = 48 lon labels); the user can switch a
  row to another unit (count recomputed) or edit the count (max 9 999 per row).
- Barcode: the unit's own barcode; base unit → product barcode, else product **code** (Code128,
  scanning works because lookup falls back to `code`). Packaging unit without its own barcode →
  label without barcode + warning.
- EAN-13 for valid 13-digit codes, otherwise Code128. Quiet zones included; bar width snapped to
  whole printer dots (203 dpi). Codes too long for the label width get a warning.
- "Bỏ qua hàng đã có mã vạch" (purchases): products whose base unit already has a manufacturer
  barcode need no sticker.

## Files

| Path                                                                                  | Role                                                                                                                                    |
| ------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| `domain/printSettings.js`                                                             | Defaults, presets, clamping, label row page size, auto-print decision                                                                   |
| `domain/printSettingsForm.js`                                                         | Settings form ⇄ settings mapping, printer options                                                                                       |
| `domain/printSamples.js`, `samplePrints.js`                                           | "In thử" samples (receipt, labels, A4 template with the template editor's sample sale)                                                  |
| `printTargets.js`                                                                     | Printer routing (`getPrinterFor`) and `printDocument`                                                                                   |
| `domain/salesPrintButtons.js`, `components/SalesPrintButtons.jsx`                     | Sales print buttons per paper ("In" + "In A4" on roll paper)                                                                            |
| `components/DocumentPrintSettings.jsx`                                                | System → In ấn → Máy in A4: printer, "In thử A4", own "Lưu" (only `documentPrinterName`)                                                |
| `receipt/receiptPaper.js`, `receipt/receiptLayout.js`                                 | Roll paper geometry; layout defaults, normalization, designer editors                                                                   |
| `receipt/receiptHtml.js`, `receipt/receiptStyles.js`, `receipt/receiptContext.js`     | Roll receipt document: blocks in layout order, CSS, shared render context                                                               |
| `receipt/blocks/*.js`                                                                 | One renderer per block (`index.js` = key → renderer + zone)                                                                             |
| `receipt/receiptAmounts.js`                                                           | Total, old debt, paid, amount due                                                                                                       |
| `receipt/vietqr.js`, `receipt/banks.js`, `receipt/qrSvg.js`                           | VietQR payload + CRC, bank BIN list, QR → SVG                                                                                           |
| `receipt/receiptAssets.js`                                                            | Async: QR / barcode SVG strings before printing                                                                                         |
| `printSalesInvoice.js`                                                                | Roll receipt vs normal template for every sales print (`format: 'default' \| 'a4'`)                                                     |
| `labels/buildLabelJobs.js`, `labels/labelRows.js`                                     | Purchase/product → label rows; row edits                                                                                                |
| `labels/barcodeLayout.js`, `labels/barcodeSvg.js`                                     | Module/quiet-zone math; lazy JsBarcode rendering                                                                                        |
| `labels/labelHtml.js`, `labels/printLabels.js`                                        | Label sheet HTML (one page = one row of labels) and printing                                                                            |
| `labels/labelPrintKeys.js`, `components/useEnterToPrint.js`                           | Enter prints; scanner Enter and buttons ignored                                                                                         |
| `useLabelPrint.js`, `components/LabelPrintModal.jsx`                                  | Confirm list                                                                                                                            |
| `components/ReceiptPrintSettings.jsx`, `components/LabelPrintSettings.jsx` (+ fields) | System → In ấn forms (receipt / labels), each with its own "Lưu"                                                                        |
| `components/ReceiptPaperFields.jsx`                                                   | Paper radio, custom width/margin, printable-width hint                                                                                  |
| `components/receiptDesigner/*`                                                        | Roll receipt designer: state reducer, block list/rows, logo controls, true-size preview                                                 |
| `receipt/logoPixels.js`, `receipt/logoImage.js`                                       | Logo size + black/white threshold (pure); file → PNG data URL (canvas)                                                                  |
| `domain/bankSettingsForm.js`, `components/BankSettingsFields.jsx`                     | Shop bank select (listed BIN / "Khác") ⇄ `bankBin`; fields in System → Cửa hàng                                                         |
| `usePrintSettingsForm.js`                                                             | Shared form state: load, preset sync, save (stored print settings overlaid with the form, designer keys excluded; `names` → only those) |
| `printerList.js`, `usePrinters.js`                                                    | Electron printer list (`null` on the web)                                                                                               |

## Rules

- Builders are pure and tested (`__tests__/`); React/Electron glue stays thin (no DOM tests here).
- `electron/main.js` is self-contained: it never imports from `src/`.
- JsBarcode is loaded only when labels or a receipt barcode are printed
  (`await import('jsbarcode')`); `qrSvg.js` (qrcode-generator) only when a VietQR is printed.

## Shop setup checklist

1. Install the printer drivers (roll, A4, label) on Windows.
2. Label printer driver: paper size = one row of labels (e.g. 72 × 22 mm for 35 × 22 two-up),
   run the gap/label calibration once.
3. Receipt printer driver: the roll width (58 or 80 mm); enable "open cash drawer after print" if a drawer is
   connected (the app cannot send drawer commands).
4. System → "In ấn": pick the receipt, A4 and label printers, label size, then "In thử" /
   "In thử A4" / "In thử tem" and adjust the X/Y offsets.
