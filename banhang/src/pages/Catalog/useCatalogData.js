import { useEffect, useMemo } from 'react';
import { useCustomerStore } from '../../store/customerStore.js';
import { useProductStore } from '../../store/productStore.js';
import { useSettingsStore } from '../../store/settingsStore.js';
import { useSupplierStore } from '../../store/supplierStore.js';
import { useUnitStore } from '../../store/unitStore.js';

const activeItems = (items = []) => items.filter((item) => !item.isDeleted);

const useCatalogData = () => {
  const {
    items: products,
    add: addProduct,
    update: updateProduct,
    remove: removeProduct,
    bulkAdd: bulkAddProducts,
    bulkUpdatePricesByName,
    bulkFillMissingAvgCostFromRetail,
    load: loadProducts,
  } = useProductStore();
  const {
    items: customers,
    add: addCustomer,
    update: updateCustomer,
    remove: removeCustomer,
    bulkAdd: bulkAddCustomers,
    load: loadCustomers,
  } = useCustomerStore();
  const {
    items: suppliers,
    add: addSupplier,
    update: updateSupplier,
    remove: removeSupplier,
    bulkAdd: bulkAddSuppliers,
    load: loadSuppliers,
  } = useSupplierStore();
  const {
    items: units,
    add: addUnit,
    update: updateUnit,
    remove: removeUnit,
    bulkAdd: bulkAddUnits,
    load: loadUnits,
  } = useUnitStore();
  const { settings, load: loadSettings } = useSettingsStore();

  useEffect(() => {
    const bootstrap = async () => {
      await Promise.all([
        loadProducts(),
        loadCustomers(),
        loadSuppliers(),
        loadUnits(),
        loadSettings(),
      ]);
    };
    bootstrap();
  }, [loadProducts, loadCustomers, loadSuppliers, loadUnits, loadSettings]);

  const activeProducts = useMemo(() => activeItems(products), [products]);
  const activeCustomers = useMemo(() => activeItems(customers), [customers]);
  const activeSuppliers = useMemo(() => activeItems(suppliers), [suppliers]);
  const activeUnits = useMemo(() => activeItems(units), [units]);
  const showSensitiveInfo = Boolean(settings?.showSensitiveInfo);

  return {
    activeProducts,
    activeCustomers,
    activeSuppliers,
    activeUnits,
    showSensitiveInfo,
    addProduct,
    updateProduct,
    removeProduct,
    bulkAddProducts,
    bulkUpdatePricesByName,
    bulkFillMissingAvgCostFromRetail,
    addCustomer,
    updateCustomer,
    removeCustomer,
    bulkAddCustomers,
    loadCustomers,
    addSupplier,
    updateSupplier,
    removeSupplier,
    bulkAddSuppliers,
    loadSuppliers,
    addUnit,
    updateUnit,
    removeUnit,
    bulkAddUnits,
  };
};

export default useCatalogData;
