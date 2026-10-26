# E-invoice Assist (10 manual helpers) — Design

Date: 2026-10-26 · Status: approved · Builds on `2026-10-26-einvoice-export-design.md`

## Goal

Make the manual e-invoice workflow (export file → upload on the provider website) fast and
safe for shop staff, still **without any provider or tax-authority API** (lifetime licence).
Ten features, delivered in three phases; each phase is usable on its own.

| # | Feature | Phase |
| --- | --- | --- |
| 3 | Snapshot at export + "before/after" diff for changed invoices | 1 |
| 8 | Warning when VAT 8% expires (after 31/12/2026) | 1 |
| 5 | Reminder of unexported invoices (Home) | 1 |
| 9 | Optional hard lock of exported invoices | 1 |
| 6 | "Customer wants an e-invoice" + buyer info at the sales counter | 2 |
| 7 | E-invoice number / lookup code on the printed receipt | 2 |
| 1 | Provider profiles: built-in presets + profiles built from the shop's own template file | 3 |
| 2 | Import issued-invoice results from the provider + reconciliation | 3 |
| 10 | Adjustment / replacement export for changed invoices | 3 |
| 4 | Tax declaration report (month / quarter) | 3 |

Out of scope: provider API, cash-register real-time invoices, computing tax payable.

## Data changes

| Where | Field | Notes |
| --- | --- | --- |
| Invoice | `einvoice.series`, `einvoice.taxAuthorityCode`, `einvoice.lookupCode` | server-owned (like `number`) |
| Invoice | `einvoice.snapshot` (Mixed) | document at export time |
| Invoice | `einvoice.adjustments` ([Mixed]) | `{ at, kind, batchId, originalNumber, originalSeries, originalDate }` |
| Invoice | `einvoiceRequest: { requested, buyerName, companyName, taxCode, address, email }` | **client-owned**, set at the counter |
| Settings | `einvoiceStartDate` | ISO; reminder/report ignore older sales (empty → last 30 days for the reminder) |
| Settings | `einvoiceReminder` | default `true` |
| Settings | `einvoiceLockExported` | default `false` |
| Settings | `einvoiceLookupUrl` | provider lookup page printed on receipts |
| Settings | `einvoiceCustomProfiles` ([Mixed]) | profiles built by the shop |
| Settings | `einvoiceAdjustProfile` | default `generic-adjust` |

`stripEinvoiceFields` keeps stripping only `einvoice`; `einvoiceRequest` is accepted from
clients.

## Backend (`banhang-backend/src/modules/einvoice/`)

### Domain (pure, unit-tested)

- `documentBuilder` — buyer = customer fields overridden by non-empty `einvoiceRequest`
  fields; a request tax code makes the buyer an organisation (`companyName` from the
  request, else the customer name). Document gains `requested` (bool).
- `documentDiff.diffDocuments(before, after)` → `{ buyer: [{ field, before, after }],
  lines: [{ type: 'added'|'removed'|'changed', before?, after?, fields? }],
  totals: [{ field, before, after }], deleted }`. Lines match by `code|name` + occurrence
  order; compared fields `quantity, unitPrice, amount, vatRate, unit`.
- `reducedVat` — `REDUCED_VAT_END_ISO = '2026-12-31T16:59:59.999Z'` (end of 31/12/2026 in
  Vietnam). `validateDocument` adds a warning when the document date is after it and a line
  uses rate `8`.
- `contentChange` — `einvoiceRequest` (normalised; not requested + empty = none) becomes a
  content field. New `lockViolation(before, after, settings)` → message or `null` when
  `einvoiceLockExported` is on, the invoice is exported and the change is a content change
  or a delete.
- `resultMatcher.matchResults(rows, invoices)` — row `{ ref, date, total, number, series,
  taxAuthorityCode, lookupCode }`; match by `ref === invoice.code`, else by same local day
  (`utcOffsetMinutes`) + equal total among exported invoices without number, only when
  exactly one candidate. Returns `{ matched: [{ row, invoiceId, code }], unmatched: [row],
  ambiguous: [{ row, codes }] }`.
- `adjustment.buildAdjustment(item)` — for a `changed` item: deleted → kind `reduce`
  (lines from the snapshot), else kind `replace` (current document); carries
  `originalNumber/Series/Date` from `einvoice` + snapshot. Missing original number → error
  issue (blocks export).
- `revenueReport.buildRevenueReport(items, { groupBy, utcOffsetMinutes })` → rows per period
  `{ period, invoiceCount, total, exportedCount, exportedTotal, pendingCount, pendingTotal,
  byRate: [{ rate, beforeTax, tax, total }] }` + grand total. Deleted invoices excluded;
  exported = exported or changed.

### Services / routes (all under `/api/einvoice`)

| Route | Service | Notes |
| --- | --- | --- |
| `GET /documents?…&requestedOnly&status` | `documents` | statuses + `unnumbered` (exported, no number); `changed` items carry `diff` and `adjustment` |
| `POST /mark-exported` | `exportState` | now per invoice: stores `snapshot` (document rebuilt server-side) |
| `POST /mark-adjusted { invoiceIds, profile }` | `adjustments` | push to `adjustments`, refresh snapshot, clear number/series/codes (replace) or keep (reduce), `changedAfterExport=false` |
| `GET /summary?since&todayStart` | `summary` | `{ pendingToday, pendingEarlier, changed, unnumbered }` |
| `POST /results { rows, utcOffsetMinutes, dryRun }` | `results` | match; apply only when `dryRun` is false |
| `GET /report?from&to&groupBy&utcOffsetMinutes` | `report` | uses the same document building as export |
| `PUT /:invoiceId/number { number, series?, lookupCode? }` | `exportState` | extended |

Document loading is shared (`documents.service` exposes `buildItems(invoices, settings)`),
so export, report, results and summary agree. The repository lists deleted invoices that were
ever exported (`einvoice.exportedAt` set), so adjusted deletions stay visible.

Invoices service calls one einvoice entry point, `einvoiceGuard.service.checkChange(existing,
next)` → returns the change-flag patch or throws the lock message (HTTP 400 via the existing
controller).

## Frontend (`banhang/src/features/einvoice/`)

```
api/            einvoiceApi.js (+ summary, results, report, markAdjusted)
domain/         profileFields.js   field catalog: key → { label, value(doc, line, i), onlyFor? }
                applyProfile.js    data profiles → rows (preamble + header + body)
                headerMatching.js  normalise header text + synonyms → field key
                templateReader.js  workbook → { sheetName, preamble, headers } (header row = first row with ≥3 cells in the first 10)
                resultRows.js      provider list file → result rows (date/number parsing)
                reducedVat.js, reminder.js, reportExport.js, …
profiles/       generic.js, generic-adjust.js, <provider>.js presets, index.js (built-in + custom)
hooks/          useEinvoiceDocuments, useEinvoiceExport (issue + adjust), useEinvoiceSummary,
                useEinvoiceReport, useProfileEditor, useResultImport
components/
  list/         filters, table, row actions, export bar
  detail/       EinvoiceDetailDrawer (buyer, lines, tax, diff)
  profiles/     ProfileList, ProfileEditor (columns: field select, header, constant, order), TemplateUpload
  results/      ResultImportModal (file → mapping → preview → apply)
  report/       RevenueReport (table + Excel)
  pos/          EinvoiceRequestControl (checkbox + buyer modal, "save to customer")
  settings/     EinvoiceSettingsSection (+ new settings), ReducedVatAlert
  home/         EinvoiceReminder
screen/         EinvoiceScreen (tabs: Hoá đơn | Báo cáo | Mẫu file)
```

### Profiles (#1)

- Profiles become **data**: `{ id, name, purpose: 'issue'|'adjust', sheetName, preamble?: [[…]],
  columns: [{ header, field, constant?, onlyFor? }] }`. `applyProfile` resolves `field` through
  `profileFields`; `field: 'constant'` writes `constant`; `field: 'empty'` writes ''.
- Field catalog covers: app code, date (`DD/MM/YYYY`, `YYYY-MM-DD`), buyer fields, payment
  method (code `TM/CK` or text `Tiền mặt/Chuyển khoản`), line index/code/name/unit/qty/price/
  amount, before-tax, VAT rate (`8`, `8%`, `0.08`), tax, discount (first line), note,
  seller location code, adjustment fields (kind text, original number/series/date).
- Built-in: `generic`, `generic-adjust`, plus provider presets from public documentation
  (see "Provider presets"); presets are labelled "kiểm tra bằng tài khoản thử trước khi dùng".
- Custom: upload the provider's template → `templateReader` + `headerMatching` propose a
  profile → `ProfileEditor` → saved in `settings.einvoiceCustomProfiles`. Built-ins can be
  copied into a custom profile.

### Counter (#6) and receipt (#7)

- Sales editor only: `EinvoiceRequestControl` next to the customer box; state lives in the
  invoice draft (`useInvoiceDraftState`) and goes into the payload as `einvoiceRequest`.
  Prefilled from the selected customer; "Lưu vào khách hàng" updates the customer
  (`taxCode`, `email`, `buyerName`, address).
- E-invoice list: filter "Chỉ hoá đơn khách lấy HĐ".
- Print placeholders: `{{einvoice.number}}`, `{{einvoice.series}}`, `{{einvoice.lookupCode}}`,
  `{{einvoice.lookupUrl}}`, `{{einvoice.block}}` (one line, empty until a number exists);
  listed in the template editor help.

### Phase-1 UI

- Detail drawer opened from a row; for `changed` rows shows the diff (before/after columns,
  removed lines struck through).
- `EinvoiceReminder` on Home (only when `sellerTaxCode` set and `einvoiceReminder` on): one
  line "Còn N hoá đơn chưa xuất HĐĐT (M của các ngày trước) · K hoá đơn sửa sau khi xuất ·
  J chưa có số" → `/einvoice`.
- `ReducedVatAlert` (deduction mode, `defaultVatRate === '8'`, today after the end) on the
  e-invoice screen and in settings.
- Lock: settings switch; `confirmEinvoiceEdit` shows an info dialog and resolves `false`
  when the lock is on; delete flows show the backend message.

### Results import (#2) and adjustments (#10)

- `ResultImportModal`: pick file → sheet + header row → column mapping (guessed; required:
  number + (ref or date+total)) → preview counts → apply → list reloads. Status filter
  "Đã xuất, chưa có số" is the reconciliation view.
- Status `changed` shows "Xuất file điều chỉnh" with the adjust profile; after the file is
  saved, `mark-adjusted`.

### Report (#4)

Tab "Báo cáo": range (default this quarter), group by month/quarter; table + Excel export.
Shows revenue only (no tax-payable calculation).

## Provider presets

From public help pages and templates (research 2026-10-26); each preset records `source`
(`sample` = real template file, `docs` = official screenshots, `partial`) shown in the UI.

- Viettel S-Invoice (`docs`): sheet "Thông tin hóa đơn", header row 9 + field-key row 10,
  "Nhóm hóa đơn" groups lines (we use the app code), no date column, VAT KCT −2 / KKKNT −1,
  invoice note carries the app code.
- EasyInvoice (`sample`): ASCII headers (MaHD, NgayHoaDon…), MaHD groups lines, invoice fields
  on the first row, VAT KCT −1 / KKKNT −2.
- MISA meInvoice single-rate (`docs`): header row 9, "Số thứ tự hóa đơn" groups lines, rate and
  invoice tax on the first row, "Mã đơn vị lập hóa đơn" filled by the shop; single-rate only.
- M-Invoice (`partial`): "Số đơn hàng" groups lines, "Ký hiệu" filled by the shop.
- VNPT, BKAV: no public template → profile from the shop's own template file.
- No provider documents that a reference column comes back in its issued-invoice export, so
  result matching falls back to day + total.

## Testing

- BE unit: diff, reduced VAT warning, lock, buyer override, result matching, adjustment,
  revenue report.
- Contract (demo dispatch): snapshot + diff, lock rejects edit/delete, summary counts,
  results dry-run/apply, mark-adjusted, report totals equal document totals, requested filter.
- FE unit: field catalog/applyProfile (preamble, constants, formats), header matching,
  template reader, result rows, reminder text, print placeholders.
- Browser smoke (demo): reminder → export → edit → diff → adjust; template upload → profile;
  results import; report export.
- Files ≤ 200 lines; existing suites green; `verify:bundles` OK.

## Docs

Update `features/einvoice/README.md` (new flows, profile data contract, field catalog, how to
build a profile from a template, results import), backend README pointer, `CLAUDE.md` map line.
