import { useCallback, useMemo } from 'react';
import { getPaymentStatus } from '../invoiceUtils.js';

const DEFAULT_CUSTOMER_PRICE_KEY = '__default__';

const buildProductPriceKey = (customerId, productId) =>
  `${customerId || DEFAULT_CUSTOMER_PRICE_KEY}::${productId}`;

export const useInvoiceComputedState = ({
  customerId,
  customers = [],
  products = [],
  payments = [],
  allPayments = [],
  invoices = [],
  invoice,
  items = [],
  customerDebtOverride,
}) => {
  const paidTotal = useMemo(
    () =>
      payments.reduce((sum, payment) => sum + Number(payment.amount || 0), 0),
    [payments]
  );

  const totals = useMemo(() => {
    const subTotal = items.reduce(
      (sum, item) => sum + Number(item.lineTotal || 0),
      0
    );
    return {
      discountTotal: 0,
      subTotal,
      total: subTotal,
    };
  }, [items]);

  const totalQty = useMemo(
    () => items.reduce((sum, item) => sum + Number(item.qty || 0), 0),
    [items]
  );

  const status = useMemo(
    () => getPaymentStatus(totals.total, paidTotal),
    [paidTotal, totals.total]
  );

  const customer = useMemo(
    () => customers.find((item) => item.id === customerId),
    [customerId, customers]
  );

  const activeCustomers = useMemo(
    () => customers.filter((item) => !item.isDeleted),
    [customers]
  );

  const activeProducts = useMemo(
    () => products.filter((item) => !item.isDeleted),
    [products]
  );

  const computedCustomerDebt = useMemo(() => {
    if (!customerId) return 0;

    const relatedInvoices = invoices.filter(
      (currentInvoice) =>
        currentInvoice.customerId === customerId &&
        currentInvoice.id !== invoice?.id
    );

    const total = relatedInvoices.reduce(
      (sum, currentInvoice) => sum + Number(currentInvoice.total || 0),
      0
    );
    const paid = relatedInvoices.reduce((sum, currentInvoice) => {
      const invoicePaid = allPayments
        .filter((payment) => payment.invoiceId === currentInvoice.id)
        .reduce(
          (paymentSum, payment) => paymentSum + Number(payment.amount || 0),
          0
        );
      return sum + invoicePaid;
    }, 0);

    return total - paid;
  }, [allPayments, customerId, invoice?.id, invoices]);

  const customerDebt =
    customerDebtOverride !== undefined && customerDebtOverride !== null
      ? Number(customerDebtOverride || 0)
      : computedCustomerDebt;

  const previousInvoicePrices = useMemo(() => {
    const latestByKey = {};

    invoices.forEach((currentInvoice, invoiceIndex) => {
      if (
        !currentInvoice ||
        currentInvoice.isDeleted ||
        currentInvoice.id === invoice?.id ||
        !currentInvoice.customerId
      ) {
        return;
      }

      const currentItems = Array.isArray(currentInvoice.items)
        ? currentInvoice.items
        : [];
      if (!currentItems.length) return;

      const dateMs = new Date(currentInvoice.date || 0).getTime();
      const sortDate = Number.isFinite(dateMs) ? dateMs : -1;

      currentItems.forEach((invoiceItem, itemIndex) => {
        const productId = invoiceItem?.productId;
        if (!productId) return;

        const unitPrice = Number(invoiceItem.unitPrice);
        if (!Number.isFinite(unitPrice) || unitPrice < 0) return;

        const priceKey = buildProductPriceKey(
          currentInvoice.customerId,
          productId
        );
        const previous = latestByKey[priceKey];

        if (
          !previous ||
          sortDate > previous.sortDate ||
          (sortDate === previous.sortDate &&
            (invoiceIndex > previous.invoiceIndex ||
              (invoiceIndex === previous.invoiceIndex &&
                itemIndex > previous.itemIndex)))
        ) {
          latestByKey[priceKey] = {
            unitPrice,
            sortDate,
            invoiceIndex,
            itemIndex,
          };
        }
      });
    });

    return Object.entries(latestByKey).reduce((acc, [key, value]) => {
      acc[key] = Number(value.unitPrice || 0);
      return acc;
    }, {});
  }, [invoice?.id, invoices]);

  const getPreviousProductPrice = useCallback(
    (productId, nextCustomerId = customerId) => {
      if (!productId) return null;
      const previousPrice = Number(
        previousInvoicePrices[buildProductPriceKey(nextCustomerId, productId)]
      );
      return Number.isFinite(previousPrice) ? previousPrice : null;
    },
    [customerId, previousInvoicePrices]
  );

  const getProductPrice = useCallback(
    (product) => Number(product.sellPriceDefault || 0),
    []
  );

  return {
    paidTotal,
    totals,
    totalQty,
    status,
    customer,
    activeCustomers,
    activeProducts,
    customerDebt,
    getPreviousProductPrice,
    getProductPrice,
  };
};
