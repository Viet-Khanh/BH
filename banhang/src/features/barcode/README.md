# Barcode scanning (`features/barcode`)

USB barcode scanners act as keyboards: they type the code very fast and press Enter. This module
turns that input into sale/purchase lines. Gated by edition flags: `barcode` (scanning, search
input on sales) and `units` (unit select on lines, F4). Minimart only today.

Spec: `docs/superpowers/specs/2026-10-29-barcode-scanning-design.md`.

## Flow

```
keydown (window, capture) → scanKeyHandler → onScan(code)
  → useBarcodeLines.addByCode (queued, in scan order)
  → searchProducts(code)  (backend search matches barcode / units.barcode / code, exact first)
  → findBarcodeMatch      (utils/barcodeLines.js)
  → buildLine (sale or purchase) → mergeScannedLine → beep
```

Typed codes work without a scanner: Enter in the search box runs `quickAddByCode` first, then the
normal quick add.

## Files

| File | Role |
| --- | --- |
| `scanKeyHandler.js` | Pure keydown logic. Never blocks typed characters; on a recognized scan it swallows only the closing Enter and restores the focused field. |
| `../../utils/scanBuffer.js` | Timing rules: ≥ 4 printable ASCII chars < 40 ms apart, then Enter. Non-ASCII (Telex/IME output) or editing keys mean typing, never a scan. |
| `barcodeDom.js` | DOM glue: modal-open check, focused-field snapshot/restore (native setter + `input` event). |
| `useBarcodeScanner.js` | Mounts the handler; inactive while an Ant Design modal is open. |
| `useBarcodeLines.js` | Shared by sales and purchases: scan → line, `changeItemUnit`, F4. |
| `unitSwitchKey.js` | Pure F4 decision (no modal, no Ctrl/Alt/Meta, `units` on). |
| `quickAddByCode.js` | Search-box Enter: try the code as a barcode first. |
| `scanPlaceholder.js` | Search input placeholder when scanning is on. |

Screen adapters: `components/invoice/hooks/useInvoiceBarcode.js` (sales),
`features/purchases/hooks/usePurchaseBarcode.js` (purchases, off when read-only).

## Rules

- Never `preventDefault` character keys here: Vietnamese input methods send fast correction
  bursts that must reach the field.
- Pure logic lives in plain functions with tests (`__tests__/`); hooks stay thin (no DOM test
  environment in this repo).
- Barcodes are unique across active products and units; the backend enforces it
  (`banhang-backend/src/services/productBarcodes.service.js`).
