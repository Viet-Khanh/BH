# E-invoice Export Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Export sales invoices as an Excel file in an e-invoice provider's import format, track which invoices were exported and flag exported invoices that change afterwards.

**Architecture:** Backend module `modules/einvoice` turns invoices into provider-agnostic "documents" (pure domain functions: tax split, line mapping, payment method, validation, change detection) and stores export state on `invoice.einvoice`. The invoices service calls the pure change detector on update/delete (one-way dependency). Frontend feature `features/einvoice` applies a declarative provider profile to documents, saves the workbook, then marks invoices exported.

**Tech Stack:** Express/Mongoose (+ browser shim), React 18, Ant Design 5, `xlsx`, Vitest.

**Spec:** `docs/superpowers/specs/2026-10-26-einvoice-export-design.md`

**Conventions:** ≤ 200 lines/file, logic outside JSX, Prettier; FE tests `VITE_API_URL= npx vitest run`; BE tests `npx vitest run` in `banhang-backend`.

---

### Task 1: Schema fields

- [ ] `models/Invoice.js` add `einvoice: { exportedAt: String, exportBatchId: String, profile: String, number: String, changedAfterExport: Boolean }`.
- [ ] `models/Settings.js` add `taxMethod, sellerTaxCode, businessLocationCode, defaultVatRate, einvoiceProfile: String`, `pricesIncludeVat: Boolean`.
- [ ] `models/Product.js` add `vatRate: String`; `models/Customer.js` add `taxCode, email, buyerName: String`.
- [ ] BE + FE suites green. Commit `feat(einvoice): add e-invoice fields to models`.

### Task 2: Domain — tax, lines, payment method

`banhang-backend/src/modules/einvoice/domain/`

`vatRates.js`
```js
// Rates accepted on Vietnamese e-invoices. KCT = not subject to VAT,
// KKKNT = not declared / not paid.
export const VAT_RATES = ['0', '5', '8', '10', 'KCT', 'KKKNT'];

// null = not set, undefined = invalid.
export const normalizeVatRate = (value) => {
  if (value === null || value === undefined || value === '') return null;
  const rate = String(value).trim().toUpperCase().replace('%', '');
  return VAT_RATES.includes(rate) ? rate : undefined;
};

export const vatRateToNumber = (rate) =>
  ['5', '8', '10'].includes(rate) ? Number(rate) / 100 : 0;
```

`taxCalculator.js`
```js
import { vatRateToNumber } from './vatRates.js';

// Splits one line amount (VND) into before-tax and tax, rounding per line so the
// document total equals what the customer paid when prices include VAT.
export const splitTax = ({ amount, rate, pricesIncludeVat }) => {
  const total = Math.round(Number(amount || 0));
  const ratio = vatRateToNumber(rate);
  if (pricesIncludeVat) {
    const beforeTax = Math.round(total / (1 + ratio));
    return { beforeTax, tax: total - beforeTax, total };
  }
  const tax = Math.round(total * ratio);
  return { beforeTax: total, tax, total: total + tax };
};
```

`lineMapper.js` — `mapLine(item, product, index)` → `{ index, code, name, unit, quantity, unitPrice, amount, note }`; with both dimensions > 0: `quantity = round3(qty × L × W)`, `unit = 'm2'`, `name = "<name> (<qty> <unit>, <L>×<W>)"` (decimal comma).

`paymentMethod.js` — `resolvePaymentMethod(payments)`: methods of payments with amount > 0 mapped `bank → CK`, else `TM`; exactly one distinct → it, otherwise `TM/CK`.

Tests `__tests__/taxAndLines.test.js`: inclusive split (8%: 108000 → 100000 + 8000; 10001 → 9260 + 741), exclusive split, KCT → tax 0, `normalizeVatRate('8%') === '8'`, invalid → undefined, plain line mapping, m² line (qty 3, 1.2 × 2.4 → quantity 8.64, unit m2, name contains "3 cây, 1,2×2,4"), payment methods (cash only, bank only, mixed, none).

Commit `feat(einvoice): tax split, line mapping and payment method`.

### Task 3: Domain — document, validation, change detection

`documentBuilder.js`
```js
export const resolveTaxSettings = (settings = {}) => ({
  taxMethod: settings.taxMethod === 'deduction' ? 'deduction' : 'direct',
  pricesIncludeVat: settings.pricesIncludeVat !== false,
  defaultVatRate: settings.defaultVatRate ?? '8',
});
// buildDocument({ invoice, customer, productById, payments, settings }) →
// { invoiceId, code, date, taxMethod, seller, buyer, paymentMethod, discount, lines, totals }
// deduction lines add { vatRate, beforeTax, tax }; vatRate = product.vatRate ?? settings.defaultVatRate.
```
`validation.js` — `validateSettings(settings)` → blocking issues (missing `sellerTaxCode`); `validateDocument(doc)` → `[{ level: 'error' | 'warning', message }]` (no lines; qty ≤ 0; negative price; invalid/missing rate in deduction; buyer tax code without address → warning).

`contentChange.js`
```js
const CONTENT_FIELDS = ['customerId', 'date', 'total', 'discountTotal'];
const LINE_FIELDS = ['productId', 'qty', 'unitPrice', 'lineTotal', 'length', 'width', 'lineNote'];
export const isExported = (invoice) => Boolean(invoice?.einvoice?.exportedAt);
export const hasContentChange = (before, after) => …; // numeric-normalized comparison
// $set patch for the invoices service; `after === null` means deleted.
export const buildChangeFlagPatch = (before, after) =>
  isExported(before) && (after === null || hasContentChange(before, after))
    ? { 'einvoice.changedAfterExport': true }
    : {};
// `einvoice` is server-owned: never accept it from clients.
export const stripEinvoiceFields = ({ einvoice: _einvoice, ...rest } = {}) => rest;
```
Tests: direct vs deduction documents, totals, discount, walk-in buyer, validation messages, change detection (paymentStatus-only update → no change; qty/total/customer/date change → change; numeric string vs number equal; delete), strip.

Commit `feat(einvoice): documents, validation and change detection`.

### Task 4: Service, routes, invoices hook

- [ ] `repositories/einvoice.repository.js`: `findMainSettings`, `findSalesInvoices({ from, to })` (`date` `$gte/$lte`, not deleted OR changed-after-export), `findCustomersByIds`, `findProductsByIds`, `findPaymentsByInvoiceIds`, `updateEinvoiceFields(ids, fields)` (updateMany `$set` dotted), `setEinvoiceNumber`.
- [ ] `services/einvoice.service.js`: `listDocuments({ from, to, status, search })` (skips `importBatchId` invoices; status `pending|exported|changed|all`; search by code/customer name), `markExported({ invoiceIds, profile })` → `{ batchId, count }`, `unmarkExported({ invoiceIds })`, `setNumber(invoiceId, number)`; input validation errors → 400.
- [ ] `controllers` + `routes/einvoice.router.js`; mount `['/api/einvoice', einvoiceRouter]` in `routes/index.js` (+ `routes/einvoice.js` re-export like other modules).
- [ ] `invoices.service.js`: `createInvoiceItem`/`updateInvoiceItem` strip client `einvoice`; update merges `buildChangeFlagPatch(existing, nextInvoice)` into the `$set`; delete passes `buildChangeFlagPatch(existing, null)` to `softDeleteInvoice(id, deletedAt, extraFields)`.
- [ ] Commit `feat(einvoice): backend API and change flag on invoice edits`.

### Task 5: Contract test through the demo backend

`banhang/src/features/einvoice/__tests__/einvoiceApi.contract.test.js` (memory storage, seed `minimart`):
- settings `PUT /api/settings/main { sellerTaxCode }`; `GET documents?status=pending` has items with documents, blocking `[]`.
- mark two invoices → they move to `exported`; `PUT /api/invoices/:id` with a changed line → `changed`; `PUT` with only `paymentStatus` on the other → stays `exported`; `POST /api/payments` for it → stays `exported`.
- `DELETE /api/invoices/:id` of an exported invoice → listed as `changed` with `deleted: true`.
- unmark → `pending`; `PUT /:id/number` stores the number.
- Commit `test(einvoice): contract test through the in-browser backend`.

### Task 6: Frontend domain — profiles

- [ ] `features/einvoice/domain/vatRates.js` (`VAT_RATE_OPTIONS` for selects), `statusLabels.js`.
- [ ] `profiles/generic.js` — columns per spec; `onlyFor: 'deduction'` for tax columns; discount only on the first line of a document.
- [ ] `profiles/index.js` — `PROFILES`, `getProfile(id)` (falls back to generic).
- [ ] `domain/applyProfile.js` — `applyProfile(profile, documents, { taxMethod })` → `{ sheetName, rows }` (array of arrays: header + one row per line).
- [ ] Tests: profile contract (headers strings, value functions, ids unique), applyProfile for direct/deduction (column sets, repeated invoice columns, discount on first line only).
- [ ] Commit `feat(einvoice): export profiles`.

### Task 7: Frontend screen

- [ ] `api/einvoiceApi.js` (documents, markExported, unmark, setNumber).
- [ ] `hooks/useEinvoiceDocuments.js` (filters → load; local-day range to ISO), `hooks/useEinvoiceExport.js` (applyProfile → `XLSX.utils.aoa_to_sheet` → `saveWorkbook` → markExported only if saved).
- [ ] `components/EinvoiceFilters.jsx`, `EinvoiceTable.jsx` (selection, status tag, issues), `EinvoiceRowActions.jsx` (number prompt, unmark), `EinvoiceExportBar.jsx` (profile select, export button; documents with errors are skipped with a message).
- [ ] `screen/EinvoiceScreen.jsx`; `pages/Einvoice/EinvoicePage.jsx`; route `/einvoice` in `App.jsx`; "Hoá đơn điện tử" entry in the Home report modal.
- [ ] Commit `feat(einvoice): e-invoice export screen`.

### Task 8: Settings, product and customer fields, edit guard

- [ ] `store/settingsDefaults.js`: `taxMethod: 'direct', sellerTaxCode: '', businessLocationCode: '', pricesIncludeVat: true, defaultVatRate: '8', einvoiceProfile: 'generic'`.
- [ ] `components/EinvoiceSettingsSection.jsx` (own form, saves via `useSettingsStore().update`), rendered in `System.jsx`.
- [ ] `CatalogFormModal.jsx`: product `vatRate` select when `taxMethod === 'deduction'`; customer/supplier `taxCode`, `email`; customer `buyerName`.
- [ ] `hooks/useEinvoiceEditGuard.js`: `confirmEinvoiceEdit(invoice)` (Promise<boolean>), `einvoiceDeleteNotice(invoice)`; used in `useSalesInvoicePersistence` (before update), `useReportSalesInvoiceModal` and `SalesRecent` delete confirms.
- [ ] Demo seed: edition `shop.taxCode` → settings `sellerTaxCode`; company customers get `taxCode`.
- [ ] Commit `feat(einvoice): tax settings, product/customer fields and edit warnings`.

### Task 9: Docs and verification

- [ ] `features/einvoice/README.md` (flow, data, tax rules, profile contract, add-a-provider recipe from a real sample file, out of scope).
- [ ] `CLAUDE.md` map/read-first pointers.
- [ ] Lint (0 errors), FE + BE suites, `npm run verify:bundles`, browser smoke on the demo (export downloads a file, statuses update, edit warning shows).
- [ ] Commit `docs(einvoice): document e-invoice export`.
