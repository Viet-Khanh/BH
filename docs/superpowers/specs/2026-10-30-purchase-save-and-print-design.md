# Purchases: "Lưu và in" / "Lưu không in" — Design

Date: 2026-10-30 · Status: approved · Branch: `dev-refactor-demo`

## Problem

In the purchase payment modal, "F8 - Lưu và in" and "F12 - Lưu không in" call the same handler:
save + record payment, nothing printed. The purchase slip (phiếu nhập) can only be previewed.
The label list opens after every new purchase whichever button is pressed.

## Decision (user chose "tuỳ chọn trong Hệ thống")

- **F8 "Lưu và in"**: save + payment, then — after the payment modal has closed — do what the
  settings say:
  - `purchasePrintSlip` (default `true`, all editions): print the purchase slip (the existing
    purchase preview HTML of the saved purchase) on the A4 printer (`printDocument`);
  - `autoPrintLabelsOnPurchase` (default `true`, only with the `labels` flag): open the label
    list with every line of the purchase (new or edited purchase).
  Slip first, then the label list.
- **F12 "Lưu không in"**: save + payment only; nothing printed, no label list. Labels stay
  available from the purchase detail ("In tem").
- Settings UI: System → In ấn, sub-heading **"Nhập hàng (F8 - Lưu và in)"** with its own form
  and "Lưu": switch "In phiếu nhập (máy in A4)" and, with the `labels` flag, switch "Mở danh
  sách in tem". `autoPrintLabelsOnPurchase` moves from the label form to this form (form field
  ownership test updated).
- The F8/F12 keys themselves are wired in the purchase payment modal (F8 = save and print,
  F12 = save without printing) while it is open.

## Testing

Pure: a `getPurchasePrintPlan(settings, labelsEnabled, { print })` → `{ slip, labels }` (F12 →
both false); form ownership test. Glue (modal, printing) untested (no DOM).
