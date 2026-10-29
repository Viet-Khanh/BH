import { useMemo } from 'react';
import { buildPurchaseSlipHtml } from '../domain/purchaseSlipHtml.js';

// Printable HTML of the purchase draft for the preview modal.
export const usePurchasePreviewHtml = ({ data, draft, payments }) =>
  useMemo(
    () =>
      buildPurchaseSlipHtml({
        slip: {
          code: draft.draftCode,
          date: draft.date,
          note: draft.note,
          total: draft.totals,
          supplierDebt: draft.supplierDebt,
          items: draft.items,
        },
        supplier: draft.supplier,
        payments: payments.list,
        products: data.products,
        settings: data.settings,
      }),
    [
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
    ]
  );
