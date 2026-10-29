import { useCallback, useMemo, useState } from 'react';
import { renderInvoiceTemplate } from '../../../utils/renderTemplate.js';
import { printSalesInvoice } from '../../../features/printing/printSalesInvoice.js';

const getPrintCopies = (settings) =>
  Math.max(1, Math.round(Number(settings?.printCopies || 1)));

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

  const printInvoice = useMemo(() => {
    const baseInvoice = invoice || {};
    return {
      ...baseInvoice,
      items,
      total,
      date,
      code: baseInvoice.code || draftCode,
      customerDebt,
      printNote,
    };
  }, [customerDebt, date, draftCode, invoice, items, printNote, total]);

  const buildPreviewHtml = useCallback(
    (paymentsOverride = payments) => {
      if (!settings) return '';
      return renderInvoiceTemplate({
        template: settings.invoiceTemplateHtml,
        invoice: printInvoice,
        customer,
        payments: paymentsOverride,
        products,
        settings,
      });
    },
    [customer, payments, printInvoice, products, settings]
  );

  const previewHtml = useMemo(() => buildPreviewHtml(), [buildPreviewHtml]);

  const handlePrint = useCallback(
    async (paymentsOverride) => {
      if (!settings) return;
      // The toolbar button passes its click event: use the current payments.
      const printPayments = Array.isArray(paymentsOverride)
        ? paymentsOverride
        : payments;
      await printSalesInvoice({
        settings,
        invoice: printInvoice,
        items,
        products,
        customer,
        payments: printPayments,
        buildHtml: () => buildPreviewHtml(printPayments),
        copies: getPrintCopies(settings),
      });
    },
    [
      buildPreviewHtml,
      customer,
      items,
      payments,
      printInvoice,
      products,
      settings,
    ]
  );

  return {
    previewOpen,
    setPreviewOpen,
    previewHtml,
    handlePrint,
  };
};
