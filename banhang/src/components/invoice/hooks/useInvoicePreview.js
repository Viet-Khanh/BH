import { useCallback, useMemo, useState } from 'react';
import { renderInvoiceTemplate } from '../../../utils/renderTemplate.js';
import { printHtml } from '../../../utils/printUtils.js';

export const useInvoicePreview = ({
  settings,
  invoice,
  items,
  total,
  date,
  draftCode,
  customerDebt,
  printNote,
  customer,
  payments,
  products,
}) => {
  const [previewOpen, setPreviewOpen] = useState(false);

  const buildPreviewHtml = useCallback(
    (paymentsOverride = payments) => {
      if (!settings) return '';

      const baseInvoice = invoice || {};
      return renderInvoiceTemplate({
        template: settings.invoiceTemplateHtml,
        invoice: {
          ...baseInvoice,
          items,
          total,
          date,
          code: baseInvoice.code || draftCode,
          customerDebt,
          printNote,
        },
        customer,
        payments: paymentsOverride,
        products,
        settings,
      });
    },
    [
      customer,
      customerDebt,
      date,
      draftCode,
      invoice,
      items,
      payments,
      printNote,
      products,
      settings,
      total,
    ]
  );

  const previewHtml = useMemo(() => buildPreviewHtml(), [buildPreviewHtml]);

  const handlePrint = useCallback(
    async (paymentsOverride) => {
      const html = buildPreviewHtml(paymentsOverride);
      if (!html) return;

      const printCopies = Math.max(
        1,
        Math.round(Number(settings?.printCopies || 1))
      );
      await printHtml(html, { copies: printCopies, autoPageSize: true });
    },
    [buildPreviewHtml, settings?.printCopies]
  );

  return {
    previewOpen,
    setPreviewOpen,
    previewHtml,
    handlePrint,
  };
};
