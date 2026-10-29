import { useMemo } from 'react';
import { renderInvoiceTemplate } from '../../../utils/renderTemplate.js';
import { buildPurchasePreviewInvoice } from '../domain/purchasesDomain.js';

// Printable HTML of the purchase draft for the preview modal.
export const usePurchasePreviewHtml = ({ data, draft, payments }) =>
  useMemo(() => {
    if (!data.settings) return '';
    return renderInvoiceTemplate({
      template: data.settings.invoiceTemplateHtml,
      invoice: buildPurchasePreviewInvoice({
        code: draft.draftCode,
        date: draft.date,
        note: draft.note,
        total: draft.totals,
        supplierDebt: draft.supplierDebt,
        items: draft.items,
      }),
      customer: draft.supplier || { name: 'Nhà cung cấp' },
      payments: payments.list,
      products: data.products,
      settings: data.settings,
    });
  }, [
    data.products,
    data.settings,
    draft.date,
    draft.draftCode,
    draft.items,
    draft.note,
    draft.supplier,
    draft.supplierDebt,
    draft.totals,
    payments.list,
  ]);
