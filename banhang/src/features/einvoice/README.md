# E-invoice (`features/einvoice`)

Manual e-invoice workflow for a lifetime-licence product: the app **does not call** any
provider or tax-authority API. It exports sales as an Excel file in the import format of the
shop's e-invoice provider; the shop uploads it on the provider website, then brings the
results (invoice numbers) back.

Specs: `docs/superpowers/specs/2026-10-26-einvoice-export-design.md` (export) and
`2026-10-26-einvoice-assist-design.md` (the 10 helpers below).

## Flow

```
Sale (counter: "Khách lấy HĐĐT" + buyer data → invoice.einvoiceRequest)
Home reminder (GET /summary) → Hoá đơn điện tử (/einvoice), tabs:
  Hoá đơn      GET /documents?from&to&status&search&requestedOnly
               "Chưa xuất" → Xuất file (profile) → saveWorkbook → POST /mark-exported (+ snapshot)
               "Sửa sau khi xuất" → drawer shows diff → Xuất file điều chỉnh → POST /mark-adjusted
               "Nhập kết quả từ nhà cung cấp" → POST /results (dryRun, then apply)
               "Đã xuất, chưa có số" = reconciliation view; row: Số HĐĐT (PUT /:id/number), Bỏ đánh dấu
  Báo cáo kê khai   GET /report?from&to&groupBy (month|quarter) → table + Excel
  Mẫu file     built-in + custom profiles; create from the provider's template file
Receipt template: {{einvoice.block}} / number / series / lookupCode / lookupUrl
```

Statuses: `pending` → `exported` → `changed` (content edited or sale deleted after export) →
`exported` again after the adjustment file. Payments never change the status. With
`einvoiceLockExported` the backend refuses content edits/deletes of exported sales (409).

## Where things live

| Concern | Backend `banhang-backend/src/modules/einvoice/` | Frontend `features/einvoice/` |
| --- | --- | --- |
| Document, tax, m² lines, buyer (counter data wins) | `domain/documentBuilder`, `taxCalculator`, `lineMapper`, `paymentMethod` | — |
| Validation, 8% warning | `domain/validation`, `reducedVat` | `domain/reducedVat`, `components/settings/ReducedVatAlert` |
| Change flag, lock | `domain/contentChange`, `services/einvoiceGuard.service` (called by invoices) | `domain/contentChange` (mirror, parity test), `components/guards/` |
| Snapshot + diff | `domain/documentDiff`, `services/exportState.service` | `components/detail/`, `domain/diffLabels` |
| Adjustments | `domain/adjustment`, `services/adjustments.service` | `hooks/useEinvoiceExport` (purpose `adjust`) |
| Results import | `domain/resultMatcher`, `services/results.service` | `domain/resultRows`, `hooks/useResultImport`, `components/results/` |
| Reminder | `services/summary.service` | `domain/reminder`, `hooks/useEinvoiceSummary`, `components/home/` |
| Report | `domain/revenueReport`, `services/report.service` | `domain/reportExport`, `hooks/useEinvoiceReport`, `components/report/` |
| Shared document loading | `services/documentItems.js`, `documents.service.js` | `api/einvoiceApi.js` |
| File formats | — | `profiles/`, `domain/fields/`, `domain/applyProfile.js` |
| Profiles from template | — | `domain/headerMatching`, `templateReader`, `workbookRows`, `profileDraft`, `components/profiles/` |
| Counter, receipt | `models/Invoice.einvoiceRequest` | `components/pos/`, `domain/buyerRequest`, `domain/printFields` |
| Settings | `models/Settings` | `domain/settingsDefaults`, `settingsForm`, `components/settings/` |

Rules: tax/total/status logic only in the backend domain (pure, unit-tested); the frontend
domain only formats files and parses uploads. `invoice.einvoice` is server-owned (stripped from
client payloads); `invoice.einvoiceRequest` is client-owned.

## Tax rules

- `taxMethod: 'direct'` (household business, default) → sales invoice, no VAT split.
- `taxMethod: 'deduction'` → VAT invoice. Rate = product `vatRate`, else `defaultVatRate`
  (`0`,`5`,`8`,`10`,`KCT`,`KKKNT`; 8% until 31/12/2026, warned after). An invalid product rate
  is an error.
- `pricesIncludeVat` (default true): `beforeTax = round(amount / (1 + rate))`,
  `tax = amount − beforeTax`; lines also carry `unitPriceBeforeTax` (2 decimals).
- Length × width lines are exported in m² with "(3 cây, 1,2×2,4)" in the name.
- Payment method: cash only `TM`, bank only `CK`, otherwise `TM/CK`.

## Profiles (data)

```js
{
  id, name, purpose: 'issue' | 'adjust', sheetName,
  preamble: [[…], …],            // rows before the header (kept from the template)
  singleVatRate: true,           // optional: refuse invoices with several rates
  source: { status: 'sample' | 'docs' | 'partial', url },   // built-in presets only
  columns: [{
    header,                      // exact header text of the provider template
    field,                       // key from domain/fields (or 'constant' / 'empty')
    format,                      // e.g. date 'dmy'|'ymd', vatRate 'plain'|'percent'|'decimal'|'viettel'|'easyinvoice', paymentMethod 'code'|'text'
    constant, prompt,            // fixed value; prompt = the shop must fill it (export blocked until then)
    firstLineOnly,               // invoice fields written on the invoice's first row only
    subHeader,                   // optional row under the header (e.g. Viettel field keys)
    onlyFor: 'deduction',        // optional: column only for one tax method
  }],
}
```

One row per document line; `invoiceSeq` numbers invoices 1, 2, 3… inside the file. Fields are
grouped in `domain/fields/` (`invoiceFields`, `lineFields`, `adjustFields`, `formats`).
Custom profiles are stored in `settings.einvoiceCustomProfiles`.

### Provider presets

| Profile | Basis | Notes |
| --- | --- | --- |
| `viettel` | official template screenshots (2026) | sheet "Thông tin hóa đơn", header row 9, keys row 10; group = app code; no date column; KCT −2, KKKNT −1 |
| `easyinvoice` | real template file | ASCII headers, MaHD groups lines; KCT −1, KKKNT −2 |
| `misa` | template screenshot (single rate) | header row 9; rate + invoice tax on the first row; "Mã đơn vị lập hóa đơn" must be filled by the shop |
| `minvoice` | partial screenshot | "Ký hiệu" must be filled; some headers completed by guess |

VNPT and BKAV publish no template: shops create a profile from their own template file
("Tạo từ file mẫu nhà cung cấp"). Every preset must be tried once with the shop's account.
To add or fix a preset: put the exact headers in `profiles/<provider>.js`, record `source`,
add it to `BUILT_IN_PROFILES`, extend `__tests__/profiles.test.js`.

## Tests

- Backend: `modules/einvoice/__tests__/` (documents, diff, adjustment, matcher, report).
- Frontend: `__tests__/` — contract tests through the demo backend
  (`einvoiceApi.contract`, `einvoiceAssist.contract`) and domain tests (profiles, template
  import, result rows, reminder, report export, print fields, content-change parity).

## Out of scope

Provider API integration, cash-register (máy tính tiền) real-time invoices, computing tax
payable. The backend document layer is reusable for a later API integration.
