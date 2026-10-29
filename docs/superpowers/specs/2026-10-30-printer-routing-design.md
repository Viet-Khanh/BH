# Printer Routing (Receipt / A4 / Label) — Design

Date: 2026-10-30 · Status: approved · Branch: `feat/minimart-units-barcode`

## Problem

A shop machine has three printers: 58 mm roll, A4, label. Roll receipts and labels already go to
their chosen printers, but every A4/A5 print (purchase invoice, debt receipt, report/list prints,
sales invoice when the paper is "Tự động A5/A4") goes silently to the Windows default printer —
often the roll printer at a counter. Sales invoices can only be printed in one format.

## Decisions (user approved)

- New setting `documentPrinterName` (`''` = Windows default) — "Máy in A4" in System → In ấn,
  sub-heading "Máy in A4", with "In thử A4" (prints the A4/A5 invoice template sample) and its
  own "Lưu".
- Routing, in one place (`features/printing/printTargets.js`):
  - `receipt` → `receiptPrinterName` (roll formats);
  - `document` → `documentPrinterName` (A4/A5 template, purchase invoice, debt receipts, report
    and list prints);
  - `label` → `labelPrinterName`.
- `printDocument(html, options)` (features/printing) = `printHtml` with the document printer from
  the settings store; every A4/A5 call site uses it. The "choose printer" button of
  `ExportActions` keeps opening the dialog.
- Sales: one-off "In A4" next to the normal print when the default sales format is a roll paper:
  the sales toolbar shows "In" (default format) and "In A4"; "Hóa đơn gần đây" and the report
  sales invoice modal get the same choice. "Thanh toán & In" keeps the default format.
  `printSalesInvoice({ …, format })` with `format: 'default' | 'a4'`; `'a4'` forces the template
  path on the document printer. With paper "Tự động A5/A4" only the A4 button exists (as today).
- Missing printer → existing fallback (default printer + warning).

## Testing

Pure: `getPrinterFor(settings, target)`; `buildSalesPrintJob` with `format: 'a4'` on roll paper
(template + document printer) and default format unchanged. Glue untested (no DOM).

## Out of scope

Per-document printer overrides beyond the three targets; automatic printer detection.
