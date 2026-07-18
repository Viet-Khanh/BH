import { Modal, message } from 'antd';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  deleteSalesInvoice,
  getSalesInvoiceDetail,
  updateSalesInvoice,
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

  const applyInvoiceDetail = useCallback((data) => {
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
  }, []);

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
        applyInvoiceDetail(data);
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
  }, [applyInvoiceDetail, selectedInvoiceId]);

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

  const handleRefreshProfit = () => {
    if (!selectedInvoice) return;
    Modal.confirm({
      title: 'Tính lại lợi nhuận?',
      content:
        'Hóa đơn này sẽ lấy lại giá vốn hiện tại của sản phẩm để cập nhật lợi nhuận. Tổng tiền, công nợ và thanh toán không thay đổi.',
      okText: 'Cập nhật',
      cancelText: 'Hủy',
      onOk: async () => {
        try {
          const currentDetail = await getSalesInvoiceDetail(selectedInvoice.id);
          const currentInvoice = currentDetail?.invoice || selectedInvoice;
          const currentProducts = Array.isArray(currentDetail?.products)
            ? currentDetail.products
            : selectedProducts;
          const productMap = new Map(
            currentProducts
              .filter((product) => product?.id)
              .map((product) => [product.id, product])
          );
          let updatedItemsCount = 0;
          const nextItems = (currentInvoice.items || []).map((item) => {
            const product = productMap.get(item.productId);
            if (!product) return item;

            updatedItemsCount += 1;
            return {
              ...item,
              costPriceSnapshot: Number(product.avgCost || 0),
              excludeFromProfitSnapshot: Boolean(product.excludeFromProfit),
            };
          });

          if (!updatedItemsCount) {
            message.warning('Không tìm thấy sản phẩm để cập nhật giá vốn.');
            return;
          }

          await updateSalesInvoice(currentInvoice.id, {
            items: nextItems,
            changeLog: [
              ...(currentInvoice.changeLog || []),
              {
                date: new Date().toISOString(),
                note: 'Cập nhật lợi nhuận theo giá vốn hiện tại',
              },
            ],
          });

          const data = await getSalesInvoiceDetail(currentInvoice.id);
          applyInvoiceDetail(data);
          await refreshReport();
          message.success('Đã cập nhật lợi nhuận theo giá vốn hiện tại.');
        } catch (error) {
          message.error(
            `Không thể cập nhật lợi nhuận: ${error.message || 'Lỗi không xác định'}`
          );
        }
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
    handleRefreshProfit,
    openInvoice: setSelectedInvoiceId,
    closeInvoice: () => setSelectedInvoiceId(null),
    selectedCustomer,
    selectedInvoice,
    selectedItems,
  };
};
