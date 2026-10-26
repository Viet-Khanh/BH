# E-invoice export (`features/einvoice`)

Manual e-invoice workflow for a lifetime-licence product: the app **does not call** any
provider or tax-authority API. It exports sales invoices as an Excel file in the import
format of the shop's e-invoice provider; the shop uploads that file on the provider website.

Spec: `docs/superpowers/specs/2026-10-26-einvoice-export-design.md`.

## Flow

```
Báo cáo → Hoá đơn điện tử (/einvoice)
  GET /api/einvoice/documents?from&to&status&search   ← backend builds documents + issues
  select "Chưa xuất" invoices → Xuất file
    applyProfile(profile, documents) → XLSX → saveWorkbook
    only if saved: POST /api/einvoice/mark-exported    ← status "Đã xuất"
  edit/delete an exported invoice → backend sets einvoice.changedAfterExport → "Sửa sau khi xuất"
  row actions: Số HĐĐT (PUT /api/einvoice/:id/number), Bỏ đánh dấu (POST /api/einvoice/unmark)
```

Exported invoices cannot be selected again; unmark first (only if the upload failed).
Opening-balance imports (`importBatchId`) are never listed.

## Where things live

| Concern                                       | Backend `banhang-backend/src/modules/einvoice/`                                        | Frontend `features/einvoice/`                                                                                          |
| --------------------------------------------- | -------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| Tax split, m² lines, payment method, document | `domain/taxCalculator`, `lineMapper`, `paymentMethod`, `documentBuilder`               | —                                                                                                                      |
| Validation (errors block, warnings inform)    | `domain/validation.js`                                                                 | shown in `components/EinvoiceTable.jsx`                                                                                |
| Change flag on edit/delete                    | `domain/contentChange.js`, called from `modules/invoices/services/invoices.service.js` | `components/einvoiceGuards.js` (confirm dialogs)                                                                       |
| Status                                        | `domain/status.js`                                                                     | `domain/statusLabels.js`                                                                                               |
| API                                           | `services/documents.service.js`, `services/exportState.service.js`, `routes/`          | `api/einvoiceApi.js`                                                                                                   |
| File formats                                  | —                                                                                      | `profiles/`, `domain/applyProfile.js`, `hooks/useEinvoiceExport.js`                                                    |
| Settings / product / customer fields          | `models/*`                                                                             | `components/EinvoiceSettingsSection.jsx`, `ProductTaxField.jsx`, `CustomerTaxFields.jsx`, `domain/settingsDefaults.js` |

Rules: tax/total logic only in the backend domain (pure, tested); profiles only place data in
columns; `invoice.einvoice` is server-owned (stripped from client payloads).

## Tax rules

- `taxMethod: 'direct'` (household business, default) → sales invoice, no VAT columns.
- `taxMethod: 'deduction'` (company) → VAT invoice. Rate = product `vatRate`, else
  `defaultVatRate` (`0`,`5`,`8`,`10`,`KCT`,`KKKNT`; 8% until 31/12/2026). An invalid product
  rate is an error (never silently replaced).
- `pricesIncludeVat` (default true): `beforeTax = round(amount / (1 + rate))`,
  `tax = amount − beforeTax` → totals equal what the customer paid.
- Length × width lines are exported in m² (`quantity = qty × L × W`, unit `m2`) with
  "(3 cây, 1,2×2,4)" in the name, so quantity × unit price = amount.
- Payment method: cash only `TM`, bank only `CK`, otherwise `TM/CK`.

## Profile contract

```js
export default {
  id: 'misa',                       // unique
  name: 'MISA meInvoice',           // shown in selects
  sheetName: 'Sheet1',              // sheet name the provider expects
  columns: [
    { header: 'Mã hàng', value: (doc, line, lineIndex) => line.code },
    { header: 'Thuế suất', onlyFor: 'deduction', value: (doc, line) => … },
  ],
};
```

One row per document line; `doc` = backend document (`code, date, buyer, paymentMethod,
discount, lines, totals, taxMethod`), `line` = `{ index, code, name, unit, quantity, unitPrice,
amount, note, vatRate?, beforeTax?, tax? }`.

### Add a provider profile (needs a real sample file)

1. Get the provider's **Excel import template** (from the shop's provider portal or support).
2. Create `profiles/<provider>.js`: headers **exactly** as in the template, same order and
   sheet name; map codes the provider expects (e.g. rate `10%` vs `10`, payment method text).
3. Add it to `PROFILES` in `profiles/index.js`.
4. Test: `__tests__/profiles.test.js` checks the contract; add a case with a sample document,
   then import a generated file into the provider's **test/sandbox** account before release.

## Out of scope (for now)

Provider API integration, cash-register (máy tính tiền) invoices, hard locking of exported
invoices, automatic adjustment/replacement invoices. The backend document layer is designed to
be reused when an API integration is added.
