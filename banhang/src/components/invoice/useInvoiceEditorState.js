import { useCallback, useEffect, useMemo, useState } from 'react';
import { renderInvoiceTemplate } from '../../utils/renderTemplate.js';
import { generateCode } from '../../utils/codeGenerator.js';
import { hasSearchMatch, normalizeSearchText } from '../../utils/searchText.js';
import { getLineBase, getPaymentStatus } from './invoiceUtils.js';
import { createConfirmAddHandler } from './invoiceItemHandlers.js';
import { createPersistInvoice } from './invoicePayload.js';
import { createCheckoutHandler } from './invoicePaymentHandlers.js';
import {
  createAddProductHandler,
  createOpenAddModal,
  createPendingProductChangeHandler,
} from './invoiceProductHandlers.js';
import { buildInvoiceItems, createCancelTicketHandler, createNewTicketHandler } from './invoiceTicketHandlers.js';
import { buildInvoiceViewProps } from './invoiceViewProps.js';
import { printHtml } from '../../utils/printUtils.js';

const DEFAULT_CUSTOMER_PRICE_KEY = '__default__';

const buildProductPriceKey = (customerId, productId) =>
  `${customerId || DEFAULT_CUSTOMER_PRICE_KEY}::${productId}`;

const buildDefaultCustomerId = (customers) =>
  customers.find(
    (item) => !item.isDeleted && (item.name === 'Khách lẻ' || item.name === 'Khach le')
  )?.id || '';
const useInvoiceEditorState = ({
  invoice,
  customers = [],
  products = [],
  payments = [],
  allPayments = [],
  invoices = [],
  customerDebtOverride,
  settings,
  onSave,
  onAddPayment,
  onUpdatePayment,
  onRemovePayment,
  onCancel,
  onShowDebt,
  onOpenDebtReceipt,
  onShowRecent,
  onShowTemplate,
  onNewInvoice,
  onCustomerChange,
  onSearchProducts,
  onCreateProduct,
}) => {
  const isEdit = Boolean(invoice);
  const defaultCustomerId = useMemo(() => buildDefaultCustomerId(customers), [customers]);
  const [customerId, setCustomerId] = useState(invoice?.customerId || defaultCustomerId);
  const [date, setDate] = useState(invoice?.date || new Date().toISOString());
  const [items, setItems] = useState([]);
  const [note, setNote] = useState(invoice?.note || '');
  const [draftCode, setDraftCode] = useState(invoice?.code || generateCode('INV'));
  const [previewOpen, setPreviewOpen] = useState(false);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [paymentNote, setPaymentNote] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [pendingProduct, setPendingProduct] = useState(null);
  const [pendingQty, setPendingQty] = useState(1);
  const [pendingPrice, setPendingPrice] = useState(0);
  const [pendingLength, setPendingLength] = useState(null);
  const [pendingWidth, setPendingWidth] = useState(null);

  useEffect(() => {
    if (invoice) {
      setCustomerId(invoice.customerId || defaultCustomerId);
      setDate(invoice.date || new Date().toISOString());
      setNote(invoice.note || '');
      setDraftCode(invoice.code || generateCode('INV'));
      setItems(buildInvoiceItems(invoice));
      return;
    }

    setCustomerId(defaultCustomerId);
    setDate(new Date().toISOString());
    setNote('');
    setDraftCode(generateCode('INV'));
    setItems([]);
  }, [invoice, defaultCustomerId]);

  useEffect(() => {
    if (!onCustomerChange || !customerId) return;
    onCustomerChange(customerId, invoice?.id || null, date);
  }, [customerId, date, invoice?.id, onCustomerChange]);

  useEffect(() => {
    if (!onSearchProducts) return;
    const keyword = searchKeyword.trim();
    if (!keyword) return;
    const timer = setTimeout(() => {
      onSearchProducts(keyword);
    }, 250);
    return () => clearTimeout(timer);
  }, [searchKeyword, onSearchProducts]);
  const paidTotal = useMemo(
    () => payments.reduce((sum, p) => sum + Number(p.amount || 0), 0),
    [payments]
  );
  useEffect(() => {
    if (!paymentModalOpen) return;
    const basePaid = isEdit ? paidTotal : 0;
    setPaymentAmount(basePaid);
    setPaymentNote('');
    setPaymentMethod('cash');
  }, [paymentModalOpen, isEdit, paidTotal]);
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key !== 'F2') return;
      event.preventDefault();
      setSearchOpen(true);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);
  const totals = useMemo(() => {
    const subTotal = items.reduce((sum, item) => sum + Number(item.lineTotal || 0), 0);
    const total = subTotal;
    return { discountTotal: 0, subTotal, total };
  }, [items]);
  const totalQty = useMemo(
    () => items.reduce((sum, item) => sum + Number(item.qty || 0), 0),
    [items]
  );

  const status = getPaymentStatus(totals.total, paidTotal);

  const customer = useMemo(
    () => customers.find((item) => item.id === customerId),
    [customers, customerId]
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
    const related = invoices.filter(
      (inv) => inv.customerId === customerId && inv.id !== invoice?.id
    );
    const total = related.reduce((sum, inv) => sum + Number(inv.total || 0), 0);
    const paid = related.reduce((sum, inv) => {
      const invPaid = allPayments
        .filter((p) => p.invoiceId === inv.id)
        .reduce((acc, p) => acc + Number(p.amount || 0), 0);
      return sum + invPaid;
    }, 0);
    return total - paid;
  }, [customerId, invoices, allPayments, invoice]);

  const customerDebt =
    customerDebtOverride !== undefined && customerDebtOverride !== null
      ? Number(customerDebtOverride || 0)
      : computedCustomerDebt;

  const previousInvoicePrices = useMemo(() => {
    const latestByKey = {};

    invoices.forEach((inv, invoiceIndex) => {
      if (!inv || inv.isDeleted || inv.id === invoice?.id || !inv.customerId) return;
      const invItems = Array.isArray(inv.items) ? inv.items : [];
      if (!invItems.length) return;

      const dateMs = new Date(inv.date || 0).getTime();
      const sortDate = Number.isFinite(dateMs) ? dateMs : -1;

      invItems.forEach((invItem, itemIndex) => {
        const productId = invItem?.productId;
        if (!productId) return;
        const unitPrice = Number(invItem.unitPrice);
        if (!Number.isFinite(unitPrice) || unitPrice < 0) return;

        const priceKey = buildProductPriceKey(inv.customerId, productId);
        const current = latestByKey[priceKey];
        if (
          !current ||
          sortDate > current.sortDate ||
          (sortDate === current.sortDate &&
            (invoiceIndex > current.invoiceIndex ||
              (invoiceIndex === current.invoiceIndex && itemIndex > current.itemIndex)))
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
  }, [invoices, invoice?.id]);

  const getPreviousProductPrice = useCallback((productId, nextCustomerId = customerId) => {
    if (!productId) return null;
    const invoicePrice = Number(previousInvoicePrices[buildProductPriceKey(nextCustomerId, productId)]);
    return Number.isFinite(invoicePrice) ? invoicePrice : null;
  }, [customerId, previousInvoicePrices]);

  const getProductPrice = useCallback((product) => {
    return Number(product.sellPriceDefault || 0);
  }, []);

  const openAddModal = createOpenAddModal({
    setPendingProduct,
    setPendingQty,
    setPendingPrice,
    setPendingLength,
    setPendingWidth,
    setSearchOpen,
    getProductPrice,
  });

  const handleProductCreated = useCallback(
    (product) => {
      openAddModal(product);
    },
    [openAddModal]
  );

  const handleAddProduct = createAddProductHandler({
    activeProducts,
    openAddModal,
  });

  const handlePendingProductChange = createPendingProductChangeHandler({
    activeProducts,
    setPendingProduct,
    setPendingQty,
    setPendingPrice,
    setPendingLength,
    setPendingWidth,
    getProductPrice,
  });

  const handlePendingPriceChange = useCallback(
    (value) => {
      setPendingPrice(value);
    },
    []
  );

  const updateItem = (index, field, value) => {
    const next = [...items];
    const item = { ...next[index], [field]: value };
    const product = products.find((p) => p.id === item.productId);
    item.lineTotal = getLineBase(item, product);
    next[index] = item;
    setItems(next);
  };

  const pendingPreviousPrice = useMemo(() => {
    if (!pendingProduct?.id) return null;
    const price = getPreviousProductPrice(pendingProduct.id);
    return Number.isFinite(price) ? Number(price) : null;
  }, [pendingProduct, getPreviousProductPrice]);

  const applyPendingPreviousPrice = useCallback(() => {
    if (!Number.isFinite(pendingPreviousPrice)) return;
    setPendingPrice(Number(pendingPreviousPrice));
  }, [pendingPreviousPrice]);

  const removeItem = (index) => {
    const next = [...items];
    next.splice(index, 1);
    setItems(next);
  };

  const persistInvoice = createPersistInvoice({
    onSave,
    invoice,
    items,
    products,
    draftCode,
    customerId,
    defaultCustomerId,
    date,
    totals,
    status,
    note,
  });

  const buildPreviewHtml = useCallback((paymentsOverride = payments) => {
    if (!settings) return '';
    const baseInvoice = invoice || {};
    return renderInvoiceTemplate({
      template: settings.invoiceTemplateHtml,
      invoice: { ...baseInvoice, items, total: totals.total, date, code: baseInvoice.code || draftCode, customerDebt },
      customer,
      payments: paymentsOverride,
      products,
      settings,
    });
  }, [settings, invoice, items, totals.total, date, customer, payments, products, draftCode, customerDebt]);

  const previewHtml = useMemo(() => buildPreviewHtml(), [buildPreviewHtml]);

  const handlePrint = async (paymentsOverride) => {
    const html = buildPreviewHtml(paymentsOverride);
    if (!html) return;
    const printCopies = Math.max(1, Math.round(Number(settings?.printCopies || 1)));
    await printHtml(html, { copies: printCopies, autoPageSize: true });
  };

  const handleCancelTicket = createCancelTicketHandler({
    invoice,
    setItems,
    setNote,
    setDate,
    setDraftCode,
  });

  const handleNewTicket = createNewTicketHandler({
    onNewInvoice,
    setItems,
    setNote,
    setDate,
    setDraftCode,
    setCustomerId,
    defaultCustomerId,
    setSearchKeyword,
    setPendingProduct,
    setPendingQty,
    setPendingPrice,
    setPendingLength,
    setPendingWidth,
  });

  const handleCheckout = createCheckoutHandler({
    isEdit,
    paidTotal,
    paymentAmount,
    payments,
    onAddPayment,
    onUpdatePayment,
    onRemovePayment,
    paymentMethod,
    paymentNote,
    persistInvoice,
    handlePrint,
    handleNewTicket,
    setPaymentAmount,
    setPaymentNote,
    setPaymentMethod,
    setPaymentModalOpen,
  });

  const filteredQuick = useMemo(() => {
    const key = normalizeSearchText(searchKeyword);
    if (!key) return [];
    return activeProducts
      .filter((item) => hasSearchMatch(item, key))
      .slice(0, 5);
  }, [searchKeyword, activeProducts]);

  const handleQuickAdd = () => {
    if (!filteredQuick.length) {
      setSearchOpen(true);
      return;
    }
    openAddModal(filteredQuick[0]);
    setSearchKeyword('');
  };

  const confirmAdd = createConfirmAddHandler({
    pendingProduct,
    pendingQty,
    pendingPrice,
    pendingLength,
    pendingWidth,
    setItems,
    setSearchOpen,
    setPendingQty,
    setPendingLength,
    setPendingWidth,
  });

  const handleConfirmAdd = (options) => {
    return confirmAdd(options);
  };

  const totalPayment = totals.total + customerDebt;
  const remainingPayment = totalPayment - Number(paymentAmount || 0);

  return buildInvoiceViewProps({
    onCancel,
    onShowDebt,
    onOpenDebtReceipt,
    onShowRecent,
    onShowTemplate,
    showNewTicket: false,
    invoice,
    draftCode,
    date,
    setDate,
    handleCancelTicket,
    handleNewTicket,
    items,
    totalQty,
    customerDebt,
    totals,
    customerId,
    setCustomerId,
    activeCustomers,
    customer,
    note,
    setNote,
    searchKeyword,
    setSearchKeyword,
    filteredQuick,
    handleQuickAdd,
    setSearchOpen,
    handleAddProduct,
    handlePrint,
    products,
    updateItem,
    removeItem,
    isEdit,
    payments,
    paymentModalOpen,
    setPaymentModalOpen,
    totalPayment,
    remainingPayment,
    paymentAmount,
    setPaymentAmount,
    paymentMethod,
    setPaymentMethod,
    paymentNote,
    setPaymentNote,
    handleCheckout,
    searchOpen,
    activeProducts,
    pendingProduct,
    pendingQty,
    pendingPrice,
    pendingLength,
    pendingWidth,
    handlePendingProductChange,
    pendingPreviousPrice,
    applyPendingPreviousPrice,
    setPendingQty,
    setPendingPrice: handlePendingPriceChange,
    setPendingLength,
    setPendingWidth,
    handleConfirmAdd,
    previewOpen,
    setPreviewOpen,
    previewHtml,
    onSearchProducts,
    onCreateProduct,
    onProductCreated: handleProductCreated,
  });
};

export default useInvoiceEditorState;
