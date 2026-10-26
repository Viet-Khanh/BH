// Settings defaults for e-invoice export (merged into store/settingsDefaults.js).
// VAT 8% applies until 31/12/2026 (Nghị quyết 204/2025/QH15); shops can change it.
export const EINVOICE_DEFAULT_SETTINGS = {
  taxMethod: 'direct',
  sellerTaxCode: '',
  businessLocationCode: '',
  pricesIncludeVat: true,
  defaultVatRate: '8',
  einvoiceProfile: 'generic',
  einvoiceAdjustProfile: 'generic-adjust',
  einvoiceCustomProfiles: [],
  einvoiceStartDate: '',
  einvoiceReminder: true,
  einvoiceLockExported: false,
  einvoiceLookupUrl: '',
};

export const TAX_METHOD_OPTIONS = [
  {
    value: 'direct',
    label: 'Hộ kinh doanh – hoá đơn bán hàng (không tách thuế GTGT)',
  },
  {
    value: 'deduction',
    label: 'Doanh nghiệp khấu trừ – hoá đơn GTGT (thuế suất từng mặt hàng)',
  },
];
