import { useCallback, useMemo } from 'react';
import { message } from 'antd';
import { useCustomerStore } from '../../../store/customerStore.js';
import { useInvoiceStore } from '../../../store/invoiceStore.js';
import { useSettingsStore } from '../../../store/settingsStore.js';
import { useSalesBootstrap } from './useSalesBootstrap.js';
import { useSalesCatalog } from './useSalesCatalog.js';
import { useSalesCustomerDebt } from './useSalesCustomerDebt.js';
import { useSalesDebtReceipt } from './useSalesDebtReceipt.js';
import { useSalesEditor } from './useSalesEditor.js';
import { useSalesInvoicePersistence } from './useSalesInvoicePersistence.js';
import { useSalesNavigation } from './useSalesNavigation.js';
import { useSalesPayments } from './useSalesPayments.js';

export const useSalesScreen = () => {
  const navigation = useSalesNavigation();
  const {
    items: customers,
    load: loadCustomers,
    ensureDefaultCustomer,
  } = useCustomerStore();
  const { items: invoices, load: loadInvoices } = useInvoiceStore();
  const { settings, load: loadSettings } = useSettingsStore();
  const catalog = useSalesCatalog();
  const debt = useSalesCustomerDebt();
  const editor = useSalesEditor({
    editId: navigation.editId,
    copyId: navigation.copyId,
    mergeCatalogProducts: catalog.mergeCatalogProducts,
    onInvoiceDebtLoaded: debt.setCustomerDebt,
  });

  const activeCustomers = useMemo(
    () => customers.filter((customer) => !customer.isDeleted),
    [customers]
  );

  useSalesBootstrap({
    loadCustomers,
    loadInvoices,
    loadSettings,
    ensureDefaultCustomer,
  });

  const invoicePersistence = useSalesInvoicePersistence({
    editing: editor.editing,
    setEditing: editor.setEditing,
    editingRef: editor.editingRef,
    invoicePayments: editor.invoicePayments,
    setInvoicePayments: editor.setInvoicePayments,
    loadInvoices,
  });
  const payments = useSalesPayments({
    editingRef: editor.editingRef,
    invoicePaymentsRef: editor.invoicePaymentsRef,
    setEditing: editor.setEditing,
    setInvoicePayments: editor.setInvoicePayments,
  });
  const debtReceipt = useSalesDebtReceipt({
    editingRef: editor.editingRef,
    refreshCustomerDebt: debt.refreshCustomerDebt,
  });

  const searchProducts = useCallback(
    async (keyword = '') => {
      try {
        await catalog.searchProducts(keyword);
      } catch (error) {
        message.error('Không thể tải danh sách sản phẩm.');
      }
    },
    [catalog.searchProducts]
  );

  const createProduct = useCallback(
    async (values) => {
      return catalog.createCatalogProduct(values);
    },
    [catalog.createCatalogProduct]
  );

  const refreshCustomerDebt = useCallback(
    async (customerId, excludeInvoiceId, asOfDate) => {
      try {
        return await debt.refreshCustomerDebt(
          customerId,
          excludeInvoiceId,
          asOfDate
        );
      } catch (error) {
        debt.setCustomerDebt(0);
        message.error('Không thể tải công nợ khách hàng.');
        return 0;
      }
    },
    [debt.refreshCustomerDebt, debt.setCustomerDebt]
  );

  return {
    navigation: {
      navigate: navigation.navigate,
      cancel: navigation.cancel,
    },
    data: {
      customers,
      activeCustomers,
      invoices,
      products: catalog.products,
      settings,
    },
    invoice: {
      editing: editor.editing,
      draft: editor.draftInvoice,
      payments: editor.invoicePayments,
      customerDebt: debt.customerDebt,
    },
    debtReceipt: {
      open: debtReceipt.open,
      setOpen: debtReceipt.setOpen,
      customerId: debtReceipt.customerId,
      openModal: debtReceipt.openModal,
      handleSuccess: debtReceipt.handleSuccess,
    },
    actions: {
      searchProducts,
      createProduct,
      refreshCustomerDebt,
      saveInvoice: invoicePersistence.saveInvoice,
      newInvoice: editor.resetEditing,
      addPayment: payments.addPayment,
      updatePayment: payments.updatePayment,
      removePayment: payments.removePayment,
    },
  };
};
