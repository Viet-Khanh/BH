# E-invoice Export (manual upload) — Design

Date: 2026-10-26 · Status: approved

## Goal

Let a shop issue its legally required e-invoices (hoá đơn điện tử) with minimal typing,
without the app calling any provider or tax-authority API: the app exports invoices as an
Excel file in the import format of the shop's e-invoice provider; the shop uploads it on the
provider's website. Fits the lifetime-licence product (no server, no recurring cost).

## Decisions

- Provider formats are **profiles** (declarative column lists). Ship the `generic`
  ("Chuẩn BanHang") profile first; add provider profiles (MISA, Viettel, …) only from real
  sample import files.
- Both tax regimes, chosen in settings: `direct` (household business, sales invoice, no VAT
  split) — default — and `deduction` (company, VAT invoice with per-line rate).
- Track export state; warn (not block) when an exported invoice is changed.
- No provider API, cash-register invoices, hard locking or auto adjustment invoices
  (out of scope; the backend document layer is reusable for a later API integration).

## Data

| Where | Field | Notes |
| --- | --- | --- |
| Settings | `taxMethod` | `direct` (default) / `deduction` |
| Settings | `sellerTaxCode`, `businessLocationCode` | location code required for multi-shop households |
| Settings | `pricesIncludeVat` | default `true` |
| Settings | `defaultVatRate` | default `8` (`0`,`5`,`8`,`10`,`KCT`,`KKKNT`) |
| Settings | `einvoiceProfile` | default `generic` |
| Product | `vatRate` | empty → settings default; edited only in `deduction` mode |
| Customer | `taxCode`, `email`, `buyerName` | optional |
| Invoice | `einvoice: { exportedAt, exportBatchId, profile, number, changedAfterExport }` | |

## Document rules (backend, pure)

- `direct`: lines keep qty, unit price, amount; no tax fields.
- `deduction`: per line, `amount` = line total; if prices include VAT,
  `beforeTax = round(amount / (1 + rate))`, `tax = amount − beforeTax` (so totals match what
  the customer paid); otherwise `beforeTax = amount`, `tax = round(amount × rate)`.
  `KCT`/`KKKNT`/`0` → tax 0.
- Length × width lines: quantity = measured quantity (m²), unit `m2`, unit price = per m²,
  description appends "(<qty> <unit>, <L>×<W>)" so qty × price = amount.
- Invoice `discountTotal` > 0 → document-level discount.
- Payment method from payments: only cash → `TM`, only bank → `CK`, otherwise `TM/CK`.
- Validation: blocking for the whole export — missing `sellerTaxCode`; blocking per invoice —
  qty ≤ 0, negative price, invalid VAT rate in `deduction` mode; warnings — buyer with tax
  code but no address.

## Backend module `banhang-backend/src/modules/einvoice/`

- `domain/` (pure): `taxCalculator`, `lineMapper`, `paymentMethod`, `documentBuilder`,
  `validation`, `contentChange`.
- `repositories/`, `services/`, `controllers/`, `routes/`:
  - `GET /api/einvoice/documents?from&to&status&search` → `{ blocking: [], items: [{ invoiceId, code, date, status, issues, document }] }`
    (`status`: `pending` | `exported` | `changed` | `all`).
  - `POST /api/einvoice/mark-exported { invoiceIds, profile }` → batch id.
  - `POST /api/einvoice/unmark { invoiceIds }`.
  - `PUT /api/einvoice/:invoiceId/number { number }`.
- Change flag: every invoice update/delete path calls `contentChange` (one-way dependency
  invoices → einvoice/domain) and sets `einvoice.changedAfterExport` when content of an
  exported invoice changes (items, total, discount, customer, date) or it is deleted.
  Payment-only changes never set it.
- Schemas of Settings, Product, Customer, Invoice get the new fields (strict mode).

## Frontend module `banhang/src/features/einvoice/`

- `api/einvoiceApi.js`; `profiles/` (`index.js`, `generic.js`); `domain/applyProfile.js`,
  `statusLabels.js`; `hooks/useEinvoiceDocuments.js`, `useEinvoiceExport.js`,
  `useEinvoiceEditGuard.js`; `components/` (filters, table, row actions, settings section);
  `screen/EinvoiceScreen.jsx`.
- Profile contract: `{ id, name, sheetName, columns: [{ header, value(doc, line), format? }] }`;
  one Excel row per document line, invoice columns repeated.
- Export: build workbook → `saveWorkbook` → only when saved, call `mark-exported`.
- Core touch points: route `/einvoice` + entry in the Home report modal; settings section in
  System; `vatRate` in product form (deduction only); `taxCode`/`email` in customer form;
  confirm dialog before saving an exported invoice.

## Demo

Works through the in-browser backend. Seed data gains a seller tax code and tax codes for
company customers. The backend-compatibility guard covers the new module.

## Testing

- BE unit: tax (both regimes, inclusive/exclusive, rounding keeps totals), m² mapping,
  discount, payment method, validation, content change.
- Contract (demo dispatch): documents → mark → edit invoice → `changed`; adding a payment
  keeps `exported`; unmark; number.
- FE: profile shape, `applyProfile` rows/columns.
- Browser: export from the demo, status becomes "Đã xuất".
- Files ≤ 200 lines; all existing suites green.

## Docs

`banhang/src/features/einvoice/README.md` (flow, profile contract, how to add a provider
profile from a real sample file, tax rules), plus pointers in `CLAUDE.md`.
