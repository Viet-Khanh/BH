# Printing (`features/printing`)

Receipt printer (58 mm roll) and label printer for shops that run everything on one machine.
Configured in System → "Máy in & tem"; values live in backend `Settings`. Label UI is gated by
the edition flag `labels` (minimart). Spec: `docs/superpowers/specs/2026-10-29-printing-labels-design.md`.

## Flow

```
sales print / reprint ─► printSalesInvoice ─► receiptPaper '58mm'? buildReceipt58Html : normal template
purchase created ─► (payment modal closed) ─► LabelPrintModal ─► printLabels ─► labelHtml + JsBarcode
                                                      ▲
            purchase detail "In tem" / catalog "In tem" ┘
all ─► utils/printUtils.printHtml({ deviceName, pageSizeMm | autoHeightWidthMm })
     ─► Electron `print-html` (temp file, silent, chosen printer; missing printer → default + warning)
     └► web: browser print dialog
```

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

| Path | Role |
| --- | --- |
| `domain/printSettings.js` | Defaults, presets, clamping, label row page size, auto-print decision |
| `domain/printSettingsForm.js` | Settings form ⇄ settings mapping, printer options |
| `domain/printSamples.js`, `samplePrints.js` | "In thử" samples |
| `receipt58.js` | 58 mm receipt HTML (line units, old debt, change/debt) |
| `printSalesInvoice.js` | Chooses receipt vs normal template for every sales print |
| `labels/buildLabelJobs.js`, `labels/labelRows.js` | Purchase/product → label rows; row edits |
| `labels/barcodeLayout.js`, `labels/barcodeSvg.js` | Module/quiet-zone math; lazy JsBarcode rendering |
| `labels/labelHtml.js`, `labels/printLabels.js` | Label sheet HTML (one page = one row of labels) and printing |
| `labels/labelPrintKeys.js`, `components/useEnterToPrint.js` | Enter prints; scanner Enter and buttons ignored |
| `useLabelPrint.js`, `components/LabelPrintModal.jsx` | Confirm list |
| `components/PrintSettingsSection.jsx` (+ fields) | System page section |
| `printerList.js`, `usePrinters.js` | Electron printer list (`null` on the web) |

## Rules

- Builders are pure and tested (`__tests__/`); React/Electron glue stays thin (no DOM tests here).
- `electron/main.js` is self-contained: it never imports from `src/`.
- JsBarcode is loaded only when labels are printed (`await import('jsbarcode')`).

## Shop setup checklist

1. Install both printer drivers on Windows.
2. Label printer driver: paper size = one row of labels (e.g. 72 × 22 mm for 35 × 22 two-up),
   run the gap/label calibration once.
3. Receipt printer driver: 58 mm roll; enable "open cash drawer after print" if a drawer is
   connected (the app cannot send drawer commands).
4. System → "Máy in & tem": pick both printers, label size, then "In thử" / "In thử tem" and
   adjust the X/Y offsets.
