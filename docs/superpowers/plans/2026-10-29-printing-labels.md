# Printing (Receipt 58 mm + Labels) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Sales receipts print on a 58 mm receipt printer; after saving a purchase a confirm list prints barcode/price labels on the label printer; both printers are configured in System → "Máy in & tem".

**Architecture:** Printer settings are new `Settings` fields. Electron printing gains `deviceName`, mm page sizes and a printer list. Pure builders produce receipt HTML and label jobs/HTML (tested); thin React glue opens the label confirm modal and calls `printHtml`. Gated by the new edition flag `labels` (minimart).

**Tech Stack:** Electron 30, React 18 + Ant Design 5, vitest (no DOM), JsBarcode for SVG barcodes, Express + Mongoose settings.

Spec: `docs/superpowers/specs/2026-10-29-printing-labels-design.md`. Phases 1–2 (units, barcode) are done on this branch: `banhang/src/utils/productUnits.js` (`getItemUnitName`, `getUnitSellPrice`, `getUnitOptions`, `findProductUnit`, `getBaseQty`), `banhang/src/utils/barcodeLines.js`.

Commands: backend `cd banhang-backend && npx vitest run && npm run lint` (131 pass); frontend `cd banhang && VITE_API_URL= npx vitest run && npm run lint && npm run build` (269 pass, 0 lint errors).

Git safety for every task: never `git stash` / `checkout -- <file>` / `reset` / `restore` / `clean`; user stash `stash@{0}` must stay; never touch `.gitignore` or `.vite/`. Commit only your files; each message ends with a blank line + `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`. FE files ≤ 200 lines (`banhang/AGENT.md`); no `// path` header comments; one README per new module folder.

---

### Task 1: Settings fields and edition flag `labels`

**Files:** `banhang-backend/src/models/Settings.js`, `banhang/src/store/settingsDefaults.js`, `banhang/src/editions/*/index.js`, `banhang/src/platform/__tests__/editions.test.js`, `banhang/src/editions/README.md`, `banhang/src/platform/README.md`; new `banhang/src/features/printing/domain/printSettings.js` + test.

- [ ] Add to the `Settings` schema (with defaults): `receiptPaper: { type: String, default: 'auto' }`, `receiptPrinterName: { type: String, default: '' }`, `labelPrinterName: { type: String, default: '' }`, `labelWidthMm: { type: Number, default: 35 }`, `labelHeightMm: { type: Number, default: 22 }`, `labelColumns: { type: Number, default: 2 }`, `labelGapMm: { type: Number, default: 2 }`, `labelOffsetXMm: { type: Number, default: 0 }`, `labelOffsetYMm: { type: Number, default: 0 }`, `labelShowShopName: { type: Boolean, default: true }`, `labelShowPrice: { type: Boolean, default: true }`, `autoPrintLabelsOnPurchase: { type: Boolean, default: true }`.
- [ ] `printSettings.js` (pure, tested first):

```js
export const PRINT_DEFAULT_SETTINGS = {
  receiptPaper: 'auto',
  receiptPrinterName: '',
  labelPrinterName: '',
  labelWidthMm: 35,
  labelHeightMm: 22,
  labelColumns: 2,
  labelGapMm: 2,
  labelOffsetXMm: 0,
  labelOffsetYMm: 0,
  labelShowShopName: true,
  labelShowPrice: true,
  autoPrintLabelsOnPurchase: true,
};

export const LABEL_PRESETS = [
  { value: '35x22x2', label: '35 × 22 mm, 2 tem/hàng', widthMm: 35, heightMm: 22, columns: 2 },
  { value: '40x30x1', label: '40 × 30 mm, 1 tem/hàng', widthMm: 40, heightMm: 30, columns: 1 },
  { value: '50x30x1', label: '50 × 30 mm, 1 tem/hàng', widthMm: 50, heightMm: 30, columns: 1 },
];

// Settings with print defaults filled and numbers clamped to sane ranges.
export const readPrintSettings = (settings = {}) => { /* merge defaults; widths/heights 10–120 mm, columns 1–4, gap/offsets −10–20 mm; strings trimmed */ };

// Page size of one label row in mm.
export const getLabelRowSize = (print) => ({
  widthMm: print.labelColumns * print.labelWidthMm + (print.labelColumns - 1) * print.labelGapMm,
  heightMm: print.labelHeightMm,
});
```

  Tests: defaults, clamping, `getLabelRowSize` for 35×22×2 gap 2 → `{ widthMm: 72, heightMm: 22 }`.
- [ ] `settingsDefaults.js`: spread `PRINT_DEFAULT_SETTINGS` into `getDefaultSettings()`.
- [ ] Flag `labels` in every edition (minimart `true`), shape test, README rows.
- [ ] Commit `feat(printing): printer settings and labels flag`.

---

### Task 2: Printing infrastructure (Electron + printUtils)

**Files:** `banhang/electron/main.js`, `banhang/electron/preload.cjs`, `banhang/electron/preload.js`, `banhang/src/utils/printUtils.js`, new `banhang/src/utils/printPageSize.js` + test, new `banhang/src/features/printing/printerList.js`.

- [ ] `printPageSize.js` (pure, tested first): move `normalizePageSize` and `injectPageSizeCss` out of `printUtils.js`; add `toMicrons(mm)` (`Math.round(mm * 1000)`), `buildPageSizeCss({ widthMm, heightMm })` → `@page { size: <w>mm <h>mm; margin: 0 }`, and make `injectPageSizeCss(html, pageSize)` accept either a named size or `{ widthMm, heightMm }`.
- [ ] Electron `main.js`:
  - `normalizePageSize` also accepts `{ widthMm, heightMm }` → `{ width: microns, height: microns }` (Electron's custom size; both ≥ 353 microns).
  - `print-html` reads `options.deviceName`; before printing, `const printers = await event.sender.getPrintersAsync()`; if `deviceName` is set but not in the list, print without it and return `{ ok: true, fallback: true }`; otherwise pass `deviceName` in print options.
  - new `ipcMain.handle('list-printers', (event) => event.sender.getPrintersAsync())` mapped to `{ name, displayName, isDefault }`.
- [ ] Preload (both files): `listPrinters: () => ipcRenderer.invoke('list-printers')`.
- [ ] `printUtils.js`: `printHtml(html, { copies, forceDialog, pageSize, pageSizeMm, autoPageSize, autoHeightWidthMm, deviceName })`:
  - `pageSizeMm` → custom page size (CSS + Electron).
  - `autoHeightWidthMm` (receipt) → measure content height at that width with the existing iframe measuring helper (generalize `estimateContentHeightPx` to any width), page = width × (height + 4 mm).
  - passes `deviceName` to Electron; on `result.fallback` → `message.warning(\`Không tìm thấy máy in '${deviceName}', đã in ra máy mặc định.\`)`.
  - Keep the file ≤ 200 lines (the page-size helpers moved out).
- [ ] `printerList.js`: `listPrinters()` → Electron list or `null` when not in Electron (`window.electronAPI?.listPrinters`).
- [ ] Existing calls to `printHtml` keep working unchanged. Run tests/lint/build. Commit `feat(printing): choose printer and custom page size`.

---

### Task 3: 58 mm receipt

**Files:** new `banhang/src/features/printing/receipt58.js` + test; modify `banhang/src/components/invoice/hooks/useInvoicePreview.js`.

- [ ] `buildReceipt58Html({ invoice, items, products, customer, payments, settings })` (pure, tested first). Use `getItemUnitName`, `formatMoney` (`utils/moneyFormat.js`), `escapeHtml` (`utils/htmlEscape.js`), dayjs for `DD/MM/YYYY HH:mm`. Layout: width 48 mm body, font 12px monospace-ish sans, centered shop block; for each line: name (bold) then a row `qty unit × price` left / amount right; dashed separators; total (large); paid = sum of payments; if paid < total show "Còn nợ", if paid > total show "Tiền thối"; customer line only when the customer is not the walk-in default (no customer or name "Khách lẻ" → hidden); `invoice.note` if present; footer "Cảm ơn quý khách!". Tests: line unit shown (`2 thùng × 220.000`), totals, change vs debt, walk-in hidden, HTML escaped.
- [ ] `useInvoicePreview.handlePrint`: when `settings.receiptPaper === '58mm'` → `printHtml(buildReceipt58Html(...), { copies, deviceName: settings.receiptPrinterName, autoHeightWidthMm: 58 })`; else unchanged. The on-screen preview stays the normal template.
- [ ] Commit `feat(printing): 58 mm receipt`.

---

### Task 4: Label jobs, label HTML, barcode SVG

**Files:** add dependency `jsbarcode` to `banhang/package.json` (exact version `3.11.6`; update `package-lock.json` with `npm install jsbarcode@3.11.6 --save-exact` and sync `yarn.lock` with `yarn install` — only the jsbarcode entries may change; if yarn wants to rewrite unrelated entries, stop and report); new `banhang/src/features/printing/labels/{buildLabelJobs.js,labelHtml.js,barcodeSvg.js}` + tests for the first two.

- [ ] `buildLabelJobs({ items, products, skipWithBarcode = true })` (pure, tests first). Group purchase lines by product; row default unit = base (`unitName: ''`), `count = Σ getBaseQty(line)`; helper `buildLabelRow(product, unitName, count)` returns `{ key, productId, name, unitName, unitLabel, count, price: getUnitSellPrice(product, unitName), barcode, barcodeFormat, warning, hasOwnBarcode }` with:
  - base unit: `barcode = product.barcode || product.code`, `hasOwnBarcode = Boolean(product.barcode)`;
  - packaging unit: `barcode = unit.barcode || ''`, `warning = unit.barcode ? '' : 'Đơn vị chưa có mã vạch — tem không có mã vạch.'`, `hasOwnBarcode = Boolean(unit.barcode)`;
  - `barcodeFormat = /^\d{13}$/.test(barcode) && validEan13(barcode) ? 'EAN13' : 'CODE128'` (reuse the check-digit rule; write a small `isValidEan13`);
  - `skipWithBarcode` removes rows with `hasOwnBarcode`.
  Export `buildLabelRow` (used when the user switches a row's unit: count becomes `Math.ceil(baseCount / factor)`; keep the original base count on the row as `baseCount`).
  Tests: 2 thùng (factor 24) + 3 lon of one product → one row, count 51; product without barcode → code + CODE128; EAN-13 barcode → EAN13; unit without barcode → warning, empty barcode; skip option.
- [ ] `buildLabelPagesHtml({ rows, print, shopName, renderBarcode })` (pure; `renderBarcode(value, format, { heightMm, widthMm })` injected): expand rows into `count` labels, chunk into pages of `labelColumns`; each page a `div` with fixed mm size (`getLabelRowSize`) and `page-break-after: always`; each label absolutely sized `labelWidthMm × labelHeightMm`, left = offsetX + col × (width + gap), top = offsetY; content: shop name (if enabled, 7px), product name (8px bold, 2 lines max, ellipsis), price + "/unit" (if enabled, 10px bold), barcode SVG (if barcode) with the human-readable value under it. Return full HTML document with `@page` CSS from `buildPageSizeCss`. Tests with a fake renderer: label count, pages count (5 labels, 2 columns → 3 pages), sizes in mm in the HTML, offsets applied, no barcode element when barcode empty, escaping.
- [ ] `barcodeSvg.js`: `renderBarcodeSvg(value, format, { heightMm })` — create an SVG element in `document`, `JsBarcode(svg, value, { format, displayValue: false, margin: 0, height: …, width: 1 })`, return `svg.outerHTML`; on JsBarcode error fall back to `CODE128`, then to `''`.
- [ ] Commit `feat(printing): label jobs and label sheet`.

---

### Task 5: Label confirm modal and entry points

**Files:** new `banhang/src/features/printing/components/LabelPrintModal.jsx`, new `banhang/src/features/printing/useLabelPrint.js`; modify purchases persistence/screen, `banhang/src/pages/Purchases/PurchaseDetailModal.jsx`, catalog row actions (`banhang/src/pages/Catalog/catalogViewConfigs.jsx` + `Catalog.jsx` wiring).

- [ ] `useLabelPrint({ settings, products })` → `{ open, rows, openForPurchase(items), openForProduct(product), setRowUnit(key, unitName), setRowCount(key, count), skipWithBarcode, setSkipWithBarcode, print(), close() }`. `print()` builds HTML with `buildLabelPagesHtml` + `renderBarcodeSvg` and calls `printHtml(html, { deviceName: labelPrinterName, pageSizeMm: getLabelRowSize(print) })`; message "Đã gửi N tem tới máy in." Rows with `count <= 0` are skipped.
- [ ] `LabelPrintModal`: title "In tem → <printer or 'máy in mặc định'>"; table rows: name, unit `Select` (`getUnitOptions`), count `InputNumber` (min 0), warning `Tag`; switch "Bỏ qua hàng đã có mã vạch" (only meaningful for purchases); footer total + "In (Enter)" primary (Enter key prints while the modal is open) + "Bỏ qua".
- [ ] Purchases: after a successful `createPurchase` (in `features/purchases/hooks/usePurchasePersistence.js`, or via a callback from the screen hook), when `useEditionFeature('labels')` and `settings.autoPrintLabelsOnPurchase` → `openForPurchase(savedPurchase.items)`. Not after `updatePurchase`. Get `settings` from `useSettingsStore` as other code does. Render the modal in `PurchasesScreen.jsx` (keep ≤ 200 lines; `usePurchasesScreen.js` is already over the limit — add the minimum, or wire in a new small hook).
- [ ] `PurchaseDetailModal.jsx`: "In tem" button (flag on) → `openForPurchase(detail.items)`.
- [ ] Catalog products tab: row action "In tem" (flag on) → `openForProduct(record)` (count 1, base unit, `skipWithBarcode` off).
- [ ] Commit `feat(printing): label confirm list after purchases, in purchase detail and catalog`.

---

### Task 6: "Máy in & tem" settings section

**Files:** new `banhang/src/features/printing/components/PrintSettingsSection.jsx` (+ small field components if needed), `banhang/src/features/printing/domain/printSettingsForm.js` + test; modify `banhang/src/pages/System/System.jsx` (one import + one line, file stays ≤ 200).

- [ ] Own form like `features/einvoice/components/settings/EinvoiceSettingsSection.jsx` (load from `useSettingsStore`, save with `update`).
- [ ] Receipt: printer `Select` (options from `listPrinters()`, "Máy in mặc định" = `''`; disabled on web with extra text "Chỉ chọn được trong ứng dụng máy tính; trên web chọn máy khi in."), paper `Radio` (`auto` "Tự động A5/A4", `58mm`), button "In thử" (prints a sample 58 mm receipt).
- [ ] Labels (only when flag `labels`): printer select, preset select (`LABEL_PRESETS` + "Tùy chỉnh"), width/height/columns/gap/offset inputs, content switches, auto-print switch, "In thử tem" (prints one row of sample labels: product name "Hàng mẫu", price 10.000, code `TH001`).
- [ ] `printSettingsForm.js`: `toPrintFormValues(settings)` (derive preset from size) / `fromPrintFormValues(values)` (preset → sizes; numbers clamped via `readPrintSettings`). Tests.
- [ ] Commit `feat(printing): printer and label settings section`.

---

### Task 7: Docs and verification

- [ ] `banhang/src/features/printing/README.md`: flow (settings → printHtml → Electron), receipt58, labels (barcode rule, counts in base units, skip option), files table, rules (pure builders tested; Electron-only silent printing; label printer setup tips: install driver, set paper size, calibrate gap).
- [ ] Spec status → `implemented`.
- [ ] Run: backend tests + lint; frontend tests + lint + `npm run build` + `npm run build:demo` + `npm run verify:bundles`.
- [ ] Commit `docs(printing): module README and spec status`.
