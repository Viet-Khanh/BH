# Roll Receipt: Paper Width and Designer — Design

Date: 2026-10-30 · Status: approved · Branch: `feat/minimart-units-barcode`

## Goal

Shops use 58 mm or 80 mm roll printers (sometimes other widths). The owner picks the paper width
and designs the roll receipt without HTML: switch blocks on/off, reorder them, set texts and font
size, and see a true-size preview. Blocks include the shop logo, a VietQR transfer code with the
amount due, and a barcode of the invoice number.

## Decisions (user)

- Designer = on/off blocks with order and a live preview (no HTML editing).
- Extra blocks now: VietQR transfer QR, shop logo, invoice-number barcode.

## Paper

| Field | Default | Notes |
| --- | --- | --- |
| `receiptPaper` | `'auto'` | `'auto'` (A5/A4 template), `'58mm'`, `'80mm'`, `'custom'` |
| `receiptWidthMm` | 58 | used when `custom` (40–112) |
| `receiptMarginMm` | 5 | left/right margin (0–10); presets: 58 → 5 (48 mm printable), 80 → 4 (72 mm) |

Existing `'58mm'` values keep working. Height stays measured from the content. Every non-`auto`
paper prints the roll receipt with `deviceName: receiptPrinterName`.

## Layout (`Settings.receiptLayout`, plain object)

```js
{
  fontSizePx: 12,               // 9–16
  blocks: [                     // order = print order; unknown keys dropped, missing keys appended (off)
    { key: 'logo', on: false },
    { key: 'shop', on: true },          // name, address, phone
    { key: 'title', on: true, text: 'HOÁ ĐƠN BÁN HÀNG' },
    { key: 'meta', on: true },          // invoice code + date/time
    { key: 'customer', on: true },      // hidden for walk-in customers
    { key: 'items', on: true, style: 'twoLine' }, // 'twoLine' | 'compact'
    { key: 'totals', on: true },        // total, paid, change / debt, old debt
    { key: 'note', on: true },
    { key: 'qr', on: false },           // VietQR, only when bank info is set and amount due > 0
    { key: 'barcode', on: false },      // Code128 of the invoice code
    { key: 'footer', on: true, text: 'Cảm ơn quý khách!' },
  ],
}
```

`items`, `totals` cannot be switched off (a receipt needs them); others can.

## Blocks

- **Logo**: uploaded in the designer; resized in the browser to the printable width at 203 dpi
  (max 8 px/mm × printable mm), converted to black/white (threshold), stored as a PNG data URL in
  `Settings.receiptLogo` (max ~200 KB; larger images are rejected with a message).
- **VietQR**: shop bank info in System → Cửa hàng: `bankBin` (from a list of Vietnamese banks
  with their NAPAS BIN, plus "Khác" to type a BIN), `bankAccountNo`, `bankAccountName`.
  Payload = EMVCo/VietQR (`00` 01, `01` 12 dynamic, `38` { `00` A000000727, `01` { `00` BIN,
  `01` account }, `02` QRIBFTTA }, `53` 704, `54` amount, `58` VN, `62` { `08` invoice code },
  `63` CRC16-CCITT-FALSE). Amount = amount due (`total + old debt − paid`); block hidden when
  ≤ 0 or bank info incomplete. QR rendered locally as SVG with `qrcode-generator` (no
  dependencies; works offline and in tests). The bank list must be checked against NAPAS; the
  "Khác" option covers banks not listed.
- **Invoice barcode**: Code128 of `invoice.code` via the existing lazy JsBarcode loader.

## Architecture

- `features/printing/receipt/` (pure, tested): `receiptLayout.js` (defaults, normalize),
  `receiptPaper.js` (width/margin from settings), `blocks/*.js` (one renderer per block,
  `(ctx) → html`), `receiptHtml.js` (compose blocks; replaces `receipt58.js`), `vietqr.js`
  (payload + CRC), `qrSvg.js` (qrcode-generator → SVG), bank list `banks.js`.
- Browser-only helpers: `logoImage.js` (canvas resize + threshold), barcode via
  `labels/barcodeSvg.js`.
- `printSalesInvoice` uses `receiptHtml` for every roll paper; becomes async where barcode
  rendering needs it.
- UI: System → In ấn → "Hoá đơn": printer, paper (Auto / 58 / 80 / Tùy chỉnh + width + margin),
  copies; when paper ≠ Auto, "Thiết kế hoá đơn cuộn": font size, block list (switch, up/down,
  texts, items style), logo upload/remove, preview at true width with sample data, "In thử",
  "Khôi phục mặc định", one "Lưu". Bank fields in System → Cửa hàng.

## Testing

Pure: layout normalization (order, unknown/missing keys, forced blocks), paper width/margins,
each block renderer, composed HTML (order, hidden blocks, walk-in), VietQR payload against a
known-good sample + CRC16 vector (`123456789` → `29B1`), QR SVG output non-empty, bank list
shape. Browser glue (canvas, preview) not unit-tested.

## Out of scope

Scanning the invoice barcode to open an invoice, ESC/POS raw printing, editing the A4/A5 template
with blocks.
