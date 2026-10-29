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

  // `format`: 'default' (configured paper) | 'a4' (one-off A5/A4 template).
  const handlePrint = useCallback(
    async (paymentsOverride, format = 'default') => {
      if (!settings) return;
      // Toolbar buttons pass no payments (or an event): use the current payments.
      const printPayments = Array.isArray(paymentsOverride)
        ? paymentsOverride
        : payments;
      await printSalesInvoice({
        format,
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

  // Toolbar buttons (SalesPrintButtons) print the current payments in `format`.
  const printFormat = useCallback(
    (format) => handlePrint(null, format),
    [handlePrint]
  );

  return {
    previewOpen,
    setPreviewOpen,
    previewHtml,
    handlePrint,
    printFormat,
  };
};
