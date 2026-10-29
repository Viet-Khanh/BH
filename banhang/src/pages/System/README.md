# System page (`pages/System`)

Settings page reached from Home after the system password (`systemAccess.js`). Left menu of
groups, the selected group on the right; below 768 px the menu moves to the top (horizontal).
Each group saves only its own fields (`settingsStore.update` merges into the stored settings).
Spec: `docs/superpowers/specs/2026-10-30-system-page-layout-design.md`.

The selected group is in the URL (`/system?tab=printing`) and in `sessionStorage`
(`system_page_tab`) for back-navigation; unknown or hidden keys fall back to `shop`.

## Groups

| Key        | Menu            | Settings                                                                                                                                                               | Component                                                                                |
| ---------- | --------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| `shop`     | Cửa hàng        | `shopName`, `shopPhone`, `shopAddress`; bank account for VietQR receipts: `bankBin`, `bankAccountNo`, `bankAccountName`                                                | `groups/ShopGroup.jsx` + `features/printing/components/BankSettingsFields.jsx`           |
| `sales`    | Bán hàng & kho  | `allowNegativeStock`, `autoUpdateAvgCostOnPurchase`, `lowStockThreshold`, `showSensitiveInfo`                                                                          | `groups/SalesGroup.jsx`                                                                  |
| `printing` | In ấn           | Hoá đơn: `printCopies`, receipt printer/paper/width/margin + roll designer (`receiptLayout`, `receiptLogo`) · Tem (flag `labels`) · Mẫu hoá đơn: `invoiceTemplateHtml` | `groups/PrintingGroup.jsx` + `features/printing` forms + `components/TemplateEditor.jsx` |
| `einvoice` | Hoá đơn điện tử | Tax method, seller tax code, e-invoice profiles, workflow                                                                                                              | `features/einvoice/components/settings/EinvoiceSettingsSection.jsx`                      |
| `security` | Bảo mật         | `systemPassword` (default from `systemPassword.js`)                                                                                                                    | `groups/SecurityGroup.jsx`                                                               |
| `data`     | Dữ liệu         | Tối ưu dữ liệu (`DataUpgradePanel`), Dữ liệu mẫu (flag `sampleData`)                                                                                                   | `groups/DataGroup.jsx`                                                                   |

## Files

| File                             | Role                                                                                                                                                                                        |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `System.jsx`                     | Shell: access check, initial loads, "Quay lại", menu + selected group                                                                                                                       |
| `systemGroups.js`                | Group list (`{ key, label, flag? }`), `getVisibleGroups`, `resolveGroupKey` (tested)                                                                                                        |
| `useSystemTab.js`                | Selected group from `?tab=` / `sessionStorage`                                                                                                                                              |
| `useSystemReload.js`             | Reloads every store after data is replaced (data optimisation, sample data)                                                                                                                 |
| `groups/SettingsFormSection.jsx` | Reusable small form: fields + "Lưu", saves only `names`, re-syncs while untouched; optional `toValues`/`fromValues` (module-level) when form fields differ from settings (shop bank select) |
| `groups/SystemGroupContent.jsx`  | Key → group component, with the group heading                                                                                                                                               |
| `System.css`                     | Two-column layout and sub-headings                                                                                                                                                          |

## Notes

- "Cửa hàng" bank select: a listed bank (`features/printing/receipt/banks.js`, label
  "Vietcombank (970436)", search by name/code/BIN) or "Khác" + a typed 6-digit BIN; mapping in
  `features/printing/domain/bankSettingsForm.js` (form `bankChoice`/`bankOtherBin` ⇄ `bankBin`).
- "In ấn" → "Hoá đơn" has two saves: the printer form ("Lưu": printer, paper, copies) and, for roll
  paper, the receipt designer ("Lưu thiết kế": `receiptLayout`, `receiptLogo`). Neither overwrites
  the other's fields (see `features/printing/README.md`).

## Adding a setting

Put the field in the group it belongs to; for a plain setting add its name to that group's
`NAMES` and a `Form.Item` inside `SettingsFormSection`. A new group: add it to `SYSTEM_GROUPS`
(optionally with an edition `flag`), a component in `groups/`, and map it in
`SystemGroupContent.jsx`.
