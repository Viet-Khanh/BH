import { Modal, message } from 'antd';
import { useEffect, useMemo, useState } from 'react';
import {
  deleteSalesInvoice,
  getSalesInvoiceDetail,
} from '../../../features/reports/api/reportsApi.js';
import { renderInvoiceTemplate } from '../../../utils/renderTemplate.js';
import {
  exportReportInvoiceItems,
  printReportInvoicePreview,
} from '../reportInvoiceActions.js';

export const useReportSalesInvoiceModal = ({
  location,
  navigate,
  refreshReport,
  settings,
}) => {
  const [selectedInvoiceId, setSelectedInvoiceId] = useState(null);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [selectedItems, setSelectedItems] = useState([]);
  const [selectedPayments, setSelectedPayments] = useState([]);
  const [selectedProducts, setSelectedProducts] = useState([]);

  useEffect(() => {
    if (!selectedInvoiceId) {
      setSelectedInvoice(null);
      setSelectedCustomer(null);
      setSelectedItems([]);
      setSelectedPayments([]);
      setSelectedProducts([]);
      return;
    }

    let active = true;
    const loadDetail = async () => {
      try {
        const data = await getSalesInvoiceDetail(selectedInvoiceId);
        if (!active) return;
        const invoiceItems = Array.isArray(data?.invoice?.items)
          ? data.invoice.items
          : [];
        const detailItems = Array.isArray(data?.items) ? data.items : [];
        setSelectedInvoice(data?.invoice || null);
        setSelectedCustomer(data?.customer || null);
        setSelectedItems(
          detailItems.map((item, index) => ({
            ...item,
            length: item.length ?? invoiceItems[index]?.length ?? null,
            width: item.width ?? invoiceItems[index]?.width ?? null,
          }))
        );
        setSelectedPayments(Array.isArray(data?.payments) ? data.payments : []);
        setSelectedProducts(Array.isArray(data?.products) ? data.products : []);
      } catch (error) {
        if (active) {
          message.error(
            `Không thể tải chi tiết hóa đơn: ${error.message || 'Lỗi không xác định'}`
          );
        }
      }
    };

    loadDetail();
    return () => {
      active = false;
    };
  }, [selectedInvoiceId]);

  const previewHtml = useMemo(() => {
    if (!selectedInvoice || !settings) return '';
    return renderInvoiceTemplate({
      template: settings.invoiceTemplateHtml,
      invoice: selectedInvoice,
      customer: selectedCustomer || { name: 'Khách lẻ' },
      payments: selectedPayments,
      products: selectedProducts,
      settings,
    });
  }, [
    selectedCustomer,
    selectedInvoice,
    selectedPayments,
    selectedProducts,
    settings,
  ]);

  const handleDelete = () => {
    if (!selectedInvoice) return;
    Modal.confirm({
      title: 'Xóa hóa đơn?',
      content: 'Thao tác này không thể hoàn tác.',
      okText: 'Xóa',
      cancelText: 'Hủy',
      onOk: async () => {
        try {
          await deleteSalesInvoice(selectedInvoice.id);
          setSelectedInvoiceId(null);
          await refreshReport();
          message.success('Đã xóa hóa đơn.');
        } catch (error) {
          message.error(
            `Không thể xóa hóa đơn: ${error.message || 'Lỗi không xác định'}`
          );
        }
      },
    });
  };

  const handleEdit = () => {
    if (!selectedInvoice) return;
    setSelectedInvoiceId(null);
    const params = new URLSearchParams(location.search);
    params.set('tab', 'sales');
    const returnTo = `${location.pathname}?${params.toString()}`;
    navigate('/sales', {
      state: {
        editInvoiceId: selectedInvoice.id,
        returnTo,
      },
    });
  };

  const handleCopy = () => {
    if (!selectedInvoice) return;
    setSelectedInvoiceId(null);
    const params = new URLSearchParams(location.search);
    params.set('tab', 'sales');
    const returnTo = `${location.pathname}?${params.toString()}`;
    navigate('/sales', {
      state: {
        copyInvoiceId: selectedInvoice.id,
        returnTo,
      },
    });
  };

  const handleExport = async () => {
    const exported = await exportReportInvoiceItems({
      code: selectedInvoice?.code,
      items: selectedItems,
      priceKey: 'unitPrice',
    });
    if (!exported) {
      message.warning('Không có dữ liệu để xuất.');
    }
  };

  return {
    handleCopy,
    handleDelete,
    handleEdit,
    handleExport,
    handlePrint: () =>
      printReportInvoicePreview({
        previewHtml,
        settings,
        copies: 1,
      }),
    openInvoice: setSelectedInvoiceId,
    closeInvoice: () => setSelectedInvoiceId(null),
    selectedCustomer,
    selectedInvoice,
    selectedItems,
  };
};
