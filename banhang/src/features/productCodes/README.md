# Product codes (`features/productCodes`)

How "Mã hàng" is filled for new products. Spec:
`docs/superpowers/specs/2026-10-30-product-codes-and-auto-paper-design.md` (section 1).

| Edition flag `sequentialCodes` | New product code                                                                    |
| ------------------------------ | ----------------------------------------------------------------------------------- |
| on (minimart)                  | next `SP000001`… from `GET /api/products/next-code`, filled when the form opens     |
| off (other editions)           | initials of the name (`buildCodeFromName`), de-duplicated on save (`CL3` → `CL3-2`) |

- `productCodes.js` — pure helpers: `buildCodeFromName`, `dedupeInitialsCode`,
  `resolveProductCode` (code to save), `fillImportCodes` (Excel import rows without a code).
- `useProductCodeField(form)` — form behaviour shared by the catalog form
  (`pages/Catalog/useCatalogForm.js`) and the quick create of the sales product modal
  (`components/invoice/productModal/useQuickCreateProduct.js`): `startCreate` / `startEdit`,
  name/code change handlers, `resolveCode(values, existingCodes)`.
- Codes typed by the user are never changed. De-duplication only sees the products loaded on the
  screen (catalog: all active products; sales modal: the searched ones); the backend is the
  final check — codes are unique among active products in every edition and may not equal
  another product's barcode (`banhang-backend/src/services/productCodes.service.js`, 400 error
  shown by the form).
