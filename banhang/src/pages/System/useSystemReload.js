import { useSettingsStore } from '../../store/settingsStore.js';
import { useProductStore } from '../../store/productStore.js';
import { useCustomerStore } from '../../store/customerStore.js';
import { useSupplierStore } from '../../store/supplierStore.js';
import { useUnitStore } from '../../store/unitStore.js';
import { usePurchaseStore } from '../../store/purchaseStore.js';
import { useInvoiceStore } from '../../store/invoiceStore.js';
import { usePaymentStore } from '../../store/paymentStore.js';
import { useCashbookStore } from '../../store/cashbookStore.js';

const STORES = [
  useSettingsStore,
  useProductStore,
  useCustomerStore,
  useSupplierStore,
  useUnitStore,
  usePurchaseStore,
  useInvoiceStore,
  usePaymentStore,
  useCashbookStore,
];

// Reloads every store after data is replaced (data optimisation, sample data).
export const useSystemReload = () => {
  const ensureDefaultCustomer = useCustomerStore(
    (state) => state.ensureDefaultCustomer
  );

  return async () => {
    await Promise.all(STORES.map((store) => store.getState().load()));
    await ensureDefaultCustomer();
  };
};
