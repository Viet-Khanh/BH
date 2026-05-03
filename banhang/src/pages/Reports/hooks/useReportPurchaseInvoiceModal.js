import { Modal, message } from 'antd';
import { useEffect, useMemo, useState } from 'react';
import {
  deletePurchaseReport,
  getPurchaseDetailReport,
} from '../../../features/reports/api/reportsApi.js';
import { renderInvoiceTemplate } from '../../../utils/renderTemplate.js';
import {
  exportReportInvoiceItems,
  printReportInvoicePreview,
} from '../reportInvoiceActions.js';
import { buildPurchaseInvoiceItems } from '../reportPurchaseUtils.js';

export const useReportPurchaseInvoiceModal = ({
  location,
  navigate,
  refreshReport,
  settings,
  supplierMap,
}) => {
  const [selectedPurchaseId, setSelectedPurchaseId] = useState(null);
  const [selectedPurchase, setSelectedPurchase] = useState(null);
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [selectedPayments, setSelectedPayments] = useState([]);

  useEffect(() => {
    if (!selectedPurchaseId) {
      setSelectedPurchase(null);
      setSelectedSupplier(null);
      setSelectedProducts([]);
      setSelectedPayments([]);
      return;
    }

    let active = true;
    const loadDetail = async () => {
      try {
        const data = await getPurchaseDetailReport(selectedPurchaseId);
        if (!active) return;
        setSelectedPurchase(data?.purchase || null);
        setSelectedSupplier(data?.supplier || null);
        setSelectedProducts(Array.isArray(data?.products) ? data.products : []);
        setSelectedPayments(Array.isArray(data?.payments) ? data.payments : []);
      } catch (error) {
        if (active) {
          message.error('Không thể tải chi tiết phiếu nhập.');
        }
      }
    };

    loadDetail();
    return () => {
      active = false;
    };
  }, [selectedPurchaseId]);

  const selectedItems = useMemo(
    () => buildPurchaseInvoiceItems(selectedPurchase, selectedProducts),
    [selectedProducts, selectedPurchase]
  );
  const supplier =
    selectedSupplier || supplierMap[selectedPurchase?.supplierId] || null;
  const selectedPurchaseForPrint = useMemo(() => {
    if (!selectedPurchase) return null;
    return {
      ...selectedPurchase,
      customerDebt: Number(
        selectedPurchase.customerDebt ?? selectedPurchase.oldDebt ?? 0
      ),
      items: (selectedPurchase.items || []).map((item) => ({
        ...item,
        unitPrice: item.unitCost,
        note: item.lineNote || '',
      })),
    };
  }, [selectedPurchase]);

  const previewHtml = useMemo(() => {
    if (!selectedPurchaseForPrint || !settings) return '';
    return renderInvoiceTemplate({
      template: settings.invoiceTemplateHtml,
      invoice: selectedPurchaseForPrint,
      customer: supplier || { name: '' },
      payments: selectedPayments,
      products: selectedProducts,
      settings,
    });
  }, [
    selectedPayments,
    selectedProducts,
    selectedPurchaseForPrint,
    settings,
    supplier,
  ]);

  const handleDelete = () => {
    if (!selectedPurchase) return;
    Modal.confirm({
      title: 'Xóa phiếu nhập?',
      content: 'Thao tác này không thể hoàn tác.',
      okText: 'Xóa',
      cancelText: 'Hủy',
      onOk: async () => {
        try {
          await deletePurchaseReport(selectedPurchase.id);
          setSelectedPurchaseId(null);
          await refreshReport();
          message.success('Đã xóa phiếu nhập.');
        } catch (error) {
          message.error(
            `Không thể xóa phiếu nhập: ${error.message || 'Lỗi không xác định'}`
          );
        }
      },
    });
  };

  const handleEdit = () => {
    if (!selectedPurchase) return;
    setSelectedPurchaseId(null);
    const params = new URLSearchParams(location.search);
    params.set('tab', 'purchase-invoices');
    const returnTo = `${location.pathname}?${params.toString()}`;
    navigate('/purchases', {
      state: {
        editPurchaseId: selectedPurchase.id,
        editMode: 'full',
        returnTo,
      },
    });
  };

  const handleExport = async () => {
    const exported = await exportReportInvoiceItems({
      code: selectedPurchase?.code,
      items: selectedItems,
      priceKey: 'unitCost',
    });
    if (!exported) {
      message.warning('Không có dữ liệu để xuất.');
    }
  };

  return {
    handleDelete,
    handleEdit,
    handleExport,
    handlePrint: () =>
      printReportInvoicePreview({
        previewHtml,
        settings,
        copies: 1,
      }),
    openPurchase: setSelectedPurchaseId,
    closePurchase: () => setSelectedPurchaseId(null),
    selectedItems,
    selectedPurchase,
    supplier,
  };
};
