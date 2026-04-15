import { useCallback, useEffect, useMemo } from 'react';
import { message, Modal } from 'antd';
import { useSupplierStore } from '../../../store/supplierStore.js';
import { useSettingsStore } from '../../../store/settingsStore.js';
import usePurchaseItems from '../../../pages/Purchases/usePurchaseItems.js';
import usePurchasePayments from '../../../pages/Purchases/usePurchasePayments.js';
import usePurchaseProductModal from '../../../pages/Purchases/usePurchaseProductModal.js';
import { getPurchaseDetail } from '../api/purchasesApi.js';
import { usePurchaseDebtState } from './usePurchaseDebtState.js';
import { usePurchaseDraftState } from './usePurchaseDraftState.js';
import { usePurchaseModalState } from './usePurchaseModalState.js';
import { usePurchasePaymentRecords } from './usePurchasePaymentRecords.js';
import { usePurchasePersistence } from './usePurchasePersistence.js';
import { usePurchaseRecentState } from './usePurchaseRecentState.js';
import { usePurchasesBootstrap } from './usePurchasesBootstrap.js';
import { usePurchasesCatalog } from './usePurchasesCatalog.js';
import { usePurchasesNavigation } from './usePurchasesNavigation.js';

export const usePurchasesScreen = () => {
  const navigation = usePurchasesNavigation();
  const { items: suppliers, load: loadSuppliers } = useSupplierStore();
  const { settings, load: loadSettings } = useSettingsStore();
  const catalog = usePurchasesCatalog();
  const draft = usePurchaseDraftState({ suppliers });
  const modals = usePurchaseModalState();
  const recent = usePurchaseRecentState();
  const payments = usePurchasePaymentRecords({
    editing: draft.editing,
    supplierId: draft.supplierId,
  });
  const debt = usePurchaseDebtState({
    supplierId: draft.supplierId,
    excludePurchaseId: draft.editing?.id,
  });

  usePurchasesBootstrap({ loadSettings, loadSuppliers });

  const activeSuppliers = useMemo(
    () => suppliers.filter((item) => !item.isDeleted),
    [suppliers]
  );
  const supplierOptions = useMemo(
    () => activeSuppliers.map((item) => ({ value: item.id, label: item.name })),
    [activeSuppliers]
  );

  const productModalFeatures = usePurchaseProductModal({
    activeProducts: catalog.activeProducts,
    setItems: draft.setItems,
    readOnly: draft.readOnlyEdit,
    onSearchProducts: catalog.searchProducts,
  });

  const { updateItem: updatePurchaseItem, removeItem } = usePurchaseItems({
    items: draft.items,
    setItems: draft.setItems,
    products: catalog.products,
    readOnly: draft.readOnlyEdit,
  });

  useEffect(() => {
    if (!draft.editing) return;
    draft.applyEditingValues(draft.editing);
    productModalFeatures.resetSearchState();
  }, [
    draft.applyEditingValues,
    draft.editing,
    productModalFeatures.resetSearchState,
  ]);

  const resetForm = useCallback(() => {
    draft.resetDraft();
    payments.setPurchasePayments([]);
    debt.setSupplierDebt(0);
    productModalFeatures.resetSearchState();
  }, [
    debt.setSupplierDebt,
    draft.resetDraft,
    payments.setPurchasePayments,
    productModalFeatures.resetSearchState,
  ]);

  const purchasePersistence = usePurchasePersistence({
    code: draft.draftCode,
    date: draft.date,
    supplierId: draft.supplierId,
    items: draft.items,
    note: draft.note,
    editing: draft.editing,
    isEdit: draft.isEdit,
    isFullEdit: draft.isFullEdit,
    setEditing: draft.setEditing,
    mergeCatalogProducts: catalog.mergeCatalogProducts,
  });

  const handleCancelTicket = useCallback(() => {
    Modal.confirm({
      title: 'Hủy phiếu hiện tại?',
      content: 'Dữ liệu chưa lưu sẽ bị xóa.',
      okText: 'Hủy phiếu',
      cancelText: 'Giữ lại',
      onOk: () => {
        if (draft.editing) {
          draft.applyEditingValues(draft.editing);
          return;
        }
        resetForm();
      },
    });
  }, [draft.applyEditingValues, draft.editing, resetForm]);

  const paymentFeatures = usePurchasePayments({
    editing: draft.editing,
    payments: payments.purchasePayments,
    supplierDebtOverride: debt.supplierDebt,
    supplierId: draft.supplierId,
    totals: draft.totals,
    paymentAmount: modals.paymentAmount,
    setPaymentAmount: modals.setPaymentAmount,
    paymentMethod: modals.paymentMethod,
    setPaymentMethod: modals.setPaymentMethod,
    paymentNote: modals.paymentNote,
    setPaymentNote: modals.setPaymentNote,
    paymentModalOpen: modals.paymentModalOpen,
    setPaymentModalOpen: modals.setPaymentModalOpen,
    persistPurchase: purchasePersistence.persistPurchase,
    persistOnEdit: draft.isFullEdit,
    resetForm,
    addPayment: payments.addPayment,
    updatePayment: payments.updatePayment,
    removePayment: payments.removePayment,
  });

  const fetchPurchaseDetail = useCallback(
    async (purchaseId) => {
      const data = await getPurchaseDetail(purchaseId);
      if (Array.isArray(data?.products)) {
        catalog.mergeCatalogProducts(data.products);
      }
      return data;
    },
    [catalog.mergeCatalogProducts]
  );

  useEffect(() => {
    if (!navigation.editPurchaseId) return;
    let cancelled = false;
    const loadEditingPurchase = async () => {
      try {
        const data = await fetchPurchaseDetail(navigation.editPurchaseId);
        if (cancelled) return;
        const nextPurchase = data?.purchase || null;
        if (!nextPurchase) {
          message.error('Không tìm thấy phiếu nhập.');
          return;
        }
        draft.setEditScope('full');
        draft.setEditing(nextPurchase);
        payments.setPurchasePayments(
          Array.isArray(data?.payments) ? data.payments : []
        );
      } catch (error) {
        if (!cancelled) {
          message.error('Không thể tải phiếu nhập.');
        }
      }
    };
    loadEditingPurchase();
    return () => {
      cancelled = true;
    };
  }, [
    draft.setEditScope,
    draft.setEditing,
    fetchPurchaseDetail,
    navigation.editPurchaseId,
    payments.setPurchasePayments,
  ]);

  const handleSelectDetail = useCallback(
    async (purchase) => {
      try {
        const data = await fetchPurchaseDetail(purchase.id);
        recent.setDetail(data?.purchase || purchase);
        recent.setDetailOpen(true);
      } catch (error) {
        message.error('Không thể tải chi tiết phiếu nhập.');
      }
    },
    [fetchPurchaseDetail, recent.setDetail, recent.setDetailOpen]
  );

  const handleSelectPayment = useCallback(
    async (purchase) => {
      try {
        const data = await fetchPurchaseDetail(purchase.id);
        const nextPurchase = data?.purchase || purchase;
        draft.setEditScope('payment');
        draft.setEditing(nextPurchase);
        payments.setPurchasePayments(
          Array.isArray(data?.payments) ? data.payments : []
        );
        recent.setRecentOpen(false);
        modals.setPaymentModalOpen(true);
      } catch (error) {
        message.error('Không thể tải phiếu nhập.');
      }
    },
    [
      draft.setEditScope,
      draft.setEditing,
      fetchPurchaseDetail,
      modals.setPaymentModalOpen,
      payments.setPurchasePayments,
      recent.setRecentOpen,
    ]
  );

  const handleOpenSupplierDebtPayment = useCallback(() => {
    modals.setSupplierDebtPaymentSupplierId(
      draft.supplierId || draft.editing?.supplierId || ''
    );
    modals.setSupplierDebtPaymentOpen(true);
  }, [
    draft.editing?.supplierId,
    draft.supplierId,
    modals.setSupplierDebtPaymentOpen,
    modals.setSupplierDebtPaymentSupplierId,
  ]);

  return {
    navigation: {
      navigate: navigation.navigate,
      goBack: navigation.goBack,
    },
    data: {
      suppliers,
      settings,
      products: catalog.products,
      activeSuppliers,
      supplierOptions,
      activeProducts: catalog.activeProducts,
    },
    draft: {
      supplierId: draft.supplierId,
      setSupplierId: draft.setSupplierId,
      date: draft.date,
      setDate: draft.setDate,
      note: draft.note,
      setNote: draft.setNote,
      items: draft.items,
      draftCode: draft.draftCode,
      supplier: draft.supplier,
      editing: draft.editing,
      isEdit: draft.isEdit,
      readOnlyEdit: draft.readOnlyEdit,
      totals: draft.totals,
      totalQty: draft.totalQty,
      supplierDebt: debt.supplierDebt,
      setSupplierDebt: debt.setSupplierDebt,
      resetForm,
      cancelTicket: handleCancelTicket,
    },
    recent: {
      open: recent.recentOpen,
      setOpen: recent.setRecentOpen,
      purchases: recent.recentPurchases,
      exportRows: recent.exportRows,
      filterRange: recent.filterRange,
      setFilterRange: recent.setFilterRange,
      filterSupplier: recent.filterSupplier,
      setFilterSupplier: recent.setFilterSupplier,
      detailOpen: recent.detailOpen,
      setDetailOpen: recent.setDetailOpen,
      detail: recent.detail,
    },
    productSelection: {
      searchProducts: catalog.searchProducts,
      updateItem: updatePurchaseItem,
      removeItem,
      ...productModalFeatures,
    },
    payments: {
      list: payments.purchasePayments,
      paymentModalOpen: modals.paymentModalOpen,
      setPaymentModalOpen: modals.setPaymentModalOpen,
      paymentAmount: modals.paymentAmount,
      setPaymentAmount: modals.setPaymentAmount,
      paymentMethod: modals.paymentMethod,
      setPaymentMethod: modals.setPaymentMethod,
      paymentNote: modals.paymentNote,
      setPaymentNote: modals.setPaymentNote,
      totalPayment: paymentFeatures.totalPayment,
      remainingPayment: paymentFeatures.remainingPayment,
      checkout: paymentFeatures.handleCheckout,
    },
    debtPayment: {
      open: modals.supplierDebtPaymentOpen,
      setOpen: modals.setSupplierDebtPaymentOpen,
      supplierId: modals.supplierDebtPaymentSupplierId,
      openModal: handleOpenSupplierDebtPayment,
      refreshSupplierDebt: debt.refreshSupplierDebt,
    },
    preview: {
      open: modals.previewOpen,
      setOpen: modals.setPreviewOpen,
    },
    actions: {
      selectDetail: handleSelectDetail,
      selectPayment: handleSelectPayment,
    },
  };
};
