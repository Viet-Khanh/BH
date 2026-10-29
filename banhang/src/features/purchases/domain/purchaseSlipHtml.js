import { renderInvoiceTemplate } from '../../../utils/renderTemplate.js';
import { buildPurchasePreviewInvoice } from './purchasesDomain.js';

// Purchase slip (phiếu nhập) HTML on the invoice template: the draft preview and the
// F8 "Lưu và in" print of the saved purchase. `slip` = { code, date, note, total,
// supplierDebt, items }; '' until settings are loaded.
export const buildPurchaseSlipHtml = ({
  slip,
  supplier,
  payments,
  products,
  settings,
}) => {
  if (!settings) return '';
  return renderInvoiceTemplate({
    template: settings.invoiceTemplateHtml,
    invoice: buildPurchasePreviewInvoice(slip),
    customer: supplier || { name: 'Nhà cung cấp' },
    payments,
    products,
    settings,
  });
};

// Slip of a purchase just saved, from the save response with the screen values it was
// saved from (`draft` = usePurchaseDraftState) as fallback.
export const buildSavedPurchaseSlip = ({
  purchase = {},
  draft,
  supplierDebt,
}) => ({
  code: purchase.code || draft.draftCode,
  date: purchase.date || draft.date,
  note: purchase.note ?? draft.note,
  total: purchase.total ?? draft.totals,
  supplierDebt,
  items:
    Array.isArray(purchase.items) && purchase.items.length
      ? purchase.items
      : draft.items,
});
