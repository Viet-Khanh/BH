# E-invoice Assist Implementation Plan

**Goal:** the 10 manual e-invoice helpers of `docs/superpowers/specs/2026-10-26-einvoice-assist-design.md`.

**Architecture:** pure backend domain functions (unit-tested) → einvoice services/routes →
FE feature `features/einvoice` split by sub-feature folders. Business rules only in the backend;
FE domain only formats files and parses uploads.

**Branch:** `feat/einvoice-export`. Run FE tests with `VITE_API_URL= npx vitest run`.

Each task: write tests first (domain/contract), implement, run suites, commit
(`feat(einvoice): …`, trailer `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`).

## Phase 1

### Task 1 — Snapshot + diff (#3)
- BE: `domain/documentDiff.js` (`diffDocuments(before, after)`), Invoice schema
  `einvoice.snapshot/series/taxAuthorityCode/lookupCode/adjustments`, repository: per-invoice
  `setEinvoiceState(id, fields)`, `findInvoicesByIds`; `documents.service` exports
  `buildItems(invoices, settings)`; `markExported` rebuilds documents and stores `snapshot`;
  `changed` items get `diff` (deleted → `{ deleted: true }` + snapshot lines removed).
- Repository: list deleted invoices with `einvoice.exportedAt` set.
- Tests: diff (qty change, added/removed line, buyer change, totals); contract: export → edit →
  `diff` lists changed line.
- FE: `components/detail/EinvoiceDetailDrawer.jsx` (+ `DiffView.jsx`), row click opens it;
  move list components into `components/list/`.

### Task 2 — Reduced VAT warning (#8)
- BE `domain/reducedVat.js` + warning in `validateDocument`; FE `domain/reducedVat.js`
  (`shouldWarnReducedVat(settings, now)`), `components/settings/ReducedVatAlert.jsx` on the
  screen and in the settings section. Tests both sides.

### Task 3 — Reminder (#5)
- BE `services/summary.service.js`, `GET /summary?since&todayStart`; settings fields
  `einvoiceStartDate`, `einvoiceReminder`.
- FE `domain/reminder.js` (`reminderSince(settings, now)`, `reminderText(summary)`),
  `hooks/useEinvoiceSummary.js`, `components/home/EinvoiceReminder.jsx` on Home; settings
  inputs. Tests: contract summary counts; reminder text.

### Task 4 — Lock (#9)
- BE `contentChange.lockViolation`, `services/einvoiceGuard.service.js#checkChange`, used by
  invoices update/delete; setting `einvoiceLockExported`.
- FE settings switch; `confirmEinvoiceEdit(invoice, settings)` informs + returns false when
  locked; call sites pass settings. Tests: unit lockViolation; contract edit/delete rejected,
  payment still accepted.

## Phase 2

### Task 5 — Counter request (#6)
- BE Invoice `einvoiceRequest`; contentChange includes it; documentBuilder buyer override +
  `requested`; documents filter `requestedOnly`. Unit + contract tests.
- FE `components/pos/EinvoiceRequestControl.jsx` (+ `EinvoiceBuyerModal.jsx`), draft state
  + payload + top section wiring (sales editor only); "save to customer"; list filter.

### Task 6 — Receipt placeholders (#7)
- `PUT /:id/number` accepts series/lookupCode; row action modal edits them.
- `utils/renderTemplate.js` placeholders via `features/einvoice/domain/printFields.js`;
  setting `einvoiceLookupUrl`; template editor help. Unit test placeholders.

## Phase 3

### Task 7 — Data profiles + field catalog (#1 part 1)
- `domain/profileFields.js`, rewrite `applyProfile` (field/constant/empty/preamble/onlyFor),
  convert `generic` to data, add `generic-adjust`; `profiles/index.js` merges custom profiles
  from settings (`listProfiles(settings, purpose)`, `getProfile(id, settings)`).
- Tests: existing profile tests adapted; formats; constants; preamble.

### Task 8 — Provider presets + template upload + editor (#1 part 2)
- Presets from research (source URL comments, `verified` flag shown in UI).
- `domain/headerMatching.js`, `domain/templateReader.js`; tab "Mẫu file":
  `components/profiles/ProfileList.jsx`, `ProfileEditor.jsx`, `TemplateUpload.jsx`,
  `hooks/useProfileEditor.js`; saves `einvoiceCustomProfiles`.
- Tests: header matching, template reader (preamble/header row).

### Task 9 — Results import (#2)
- BE `domain/resultMatcher.js`, `services/results.service.js`, `POST /results`.
- FE `domain/resultRows.js`, `hooks/useResultImport.js`,
  `components/results/ResultImportModal.jsx`; status option `unnumbered`.
- Tests: matcher unit; contract dry-run/apply; FE row parsing.

### Task 10 — Adjustments (#10)
- BE `domain/adjustment.js`, `services/adjustments.service.js`, `POST /mark-adjusted`;
  `changed` items carry `adjustment` + issues.
- FE export bar for `changed` status uses adjust profiles; `useEinvoiceExport` handles both.
- Tests: unit adjustment; contract mark-adjusted resets status and keeps history.

### Task 11 — Report (#4)
- BE `domain/revenueReport.js`, `services/report.service.js`, `GET /report`.
- FE tab "Báo cáo": `hooks/useEinvoiceReport.js`, `components/report/RevenueReport.jsx`,
  `domain/reportExport.js` (Excel rows). Tests: unit report; contract totals.

### Task 12 — Docs + verification
- README (feature), backend README pointer, CLAUDE.md map line.
- Full suites, lint, `verify:bundles`, browser smoke in the demo.
