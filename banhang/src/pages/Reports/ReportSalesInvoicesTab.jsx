import { useMemo, useState } from "react";
import { Modal, Select, message } from "antd";
import dayjs from "dayjs";
import { useNavigate } from "react-router-dom";
import * as XLSX from "xlsx";
import { useInvoiceStore } from "../../store/invoiceStore.js";
import { usePaymentStore } from "../../store/paymentStore.js";
import { useCustomerStore } from "../../store/customerStore.js";
import { useProductStore } from "../../store/productStore.js";
import { useSettingsStore } from "../../store/settingsStore.js";
import DateRangeFilter from "../../components/DateRangeFilter.jsx";
import { formatMoney } from "../../utils/moneyFormat.js";
import { renderInvoiceTemplate } from "../../utils/renderTemplate.js";
import ReportSalesInvoiceModal from "./ReportSalesInvoiceModal.jsx";
import {
  buildCustomerMap,
  buildInvoiceItems,
  buildInvoiceSummary,
  buildOldDebtByInvoice,
  buildPaymentsByInvoice,
  buildProductMap,
} from "./reportSalesUtils.js";

const ReportSalesInvoicesTab = () => {
  const navigate = useNavigate();
  const invoiceStore = useInvoiceStore();
  const paymentStore = usePaymentStore();
  const { items: invoices } = invoiceStore;
  const { items: payments } = paymentStore;
  const { items: customers } = useCustomerStore();
  const { items: products } = useProductStore();
  const { settings } = useSettingsStore();

  const [range, setRange] = useState(() => [
    dayjs().startOf("day").toISOString(),
    dayjs().endOf("day").toISOString(),
  ]);
  const [customerId, setCustomerId] = useState("");
  const [selectedInvoiceId, setSelectedInvoiceId] = useState(null);

  const activeCustomers = useMemo(
    () => customers.filter((item) => !item.isDeleted),
    [customers]
  );
  const customerMap = useMemo(() => buildCustomerMap(customers), [customers]);
  const productMap = useMemo(() => buildProductMap(products), [products]);
  const paymentsByInvoice = useMemo(
    () => buildPaymentsByInvoice(payments),
    [payments]
  );
  const oldDebtByInvoice = useMemo(
    () => buildOldDebtByInvoice(invoices, paymentsByInvoice),
    [invoices, paymentsByInvoice]
  );

  const filteredInvoices = useMemo(() => {
    return invoices.filter((invoice) => {
      const matchCustomer = customerId
        ? invoice.customerId === customerId
        : true;
      const matchRange =
        range[0] && range[1]
          ? !dayjs(invoice.date).isBefore(dayjs(range[0]).startOf("day")) &&
            !dayjs(invoice.date).isAfter(dayjs(range[1]).endOf("day"))
          : true;
      return matchCustomer && matchRange;
    });
  }, [invoices, customerId, range]);

  const rows = useMemo(() => {
    const sorted = [...filteredInvoices].sort(
      (a, b) => new Date(b.date) - new Date(a.date)
    );
    return sorted.map((invoice) =>
      buildInvoiceSummary(invoice, {
        customerMap,
        productMap,
        paymentsByInvoice,
        oldDebtByInvoice,
      })
    );
  }, [
    filteredInvoices,
    customerMap,
    productMap,
    paymentsByInvoice,
    oldDebtByInvoice,
  ]);

  const summary = useMemo(
    () =>
      rows.reduce(
        (acc, row) => ({
          amount: acc.amount + Number(row.amount || 0),
          paid: acc.paid + Number(row.paid || 0),
          remain: acc.remain + Number(row.remain || 0),
          profit: acc.profit + Number(row.profit || 0),
        }),
        {
          amount: 0,
          paid: 0,
          remain: 0,
          profit: 0,
        }
      ),
    [rows]
  );

  const selectedInvoice = useMemo(
    () => invoices.find((inv) => inv.id === selectedInvoiceId) || null,
    [invoices, selectedInvoiceId]
  );

  const selectedCustomer = useMemo(() => {
    if (!selectedInvoice) return null;
    return customerMap[selectedInvoice.customerId] || null;
  }, [selectedInvoice, customerMap]);

  const selectedPayments = useMemo(() => {
    if (!selectedInvoiceId) return [];
    return payments.filter((payment) => payment.invoiceId === selectedInvoiceId);
  }, [payments, selectedInvoiceId]);

  const selectedItems = useMemo(() => {
    if (!selectedInvoice) return [];
    return buildInvoiceItems(selectedInvoice, productMap);
  }, [selectedInvoice, productMap]);

  const previewHtml = useMemo(() => {
    if (!selectedInvoice || !settings) return "";
    return renderInvoiceTemplate({
      template: settings.invoiceTemplateHtml,
      invoice: selectedInvoice,
      customer: selectedCustomer || { name: "Khách lẻ" },
      payments: selectedPayments,
      products,
      settings,
    });
  }, [selectedInvoice, selectedCustomer, selectedPayments, products, settings]);

  const handlePrint = () => {
    if (!previewHtml) return;
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;
    printWindow.document.write(previewHtml);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };

  const handleExport = () => {
    if (!selectedInvoice) return;
    const rowsToExport = selectedItems.map((item, index) => ({
      STT: index + 1,
      Ten_hang: item.name,
      DVT: item.unit,
      Quy_cach: item.spec,
      So_luong: item.qty,
      Don_gia: item.unitPrice,
      Thanh_tien: item.lineTotal,
      Ghi_chu: item.note,
    }));
    if (!rowsToExport.length) {
      message.warning("Không có dữ liệu để xuất.");
      return;
    }
    const worksheet = XLSX.utils.json_to_sheet(rowsToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Hoa_don");
    XLSX.writeFile(workbook, `${selectedInvoice.code || "hoa-don"}.xlsx`);
  };

  const handleDelete = () => {
    if (!selectedInvoice) return;
    Modal.confirm({
      title: "Xóa hóa đơn?",
      content: "Thao tác này không thể hoàn tác.",
      okText: "Xóa",
      cancelText: "Hủy",
      onOk: async () => {
        const relatedPayments = payments.filter(
          (payment) => payment.invoiceId === selectedInvoice.id
        );
        await Promise.all(
          relatedPayments.map((payment) => paymentStore.remove(payment.id))
        );
        await invoiceStore.remove(selectedInvoice.id);
        setSelectedInvoiceId(null);
        message.success("Đã xóa hóa đơn.");
      },
    });
  };

  const handleEdit = () => {
    if (!selectedInvoice) return;
    setSelectedInvoiceId(null);
    navigate("/sales", { state: { editInvoiceId: selectedInvoice.id } });
  };

  return (
    <div>
      <div className="action-row">
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <span style={{ fontWeight: 600 }}>Theo ngày</span>
          <DateRangeFilter value={range} onChange={setRange} />
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <span style={{ fontWeight: 600 }}>Khách hàng</span>
          <Select
            allowClear
            placeholder="Chọn khách hàng"
            value={customerId || undefined}
            onChange={(value) => setCustomerId(value || "")}
            options={activeCustomers.map((item) => ({
              value: item.id,
              label: item.name,
            }))}
            style={{ minWidth: 220 }}
            size="large"
            showSearch
            optionFilterProp="label"
          />
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 12,
            marginLeft: "auto",
          }}
        >
          <div style={{ display: "flex", gap: 40 }}>
            <strong className="text-primary">Tiền hàng: {formatMoney(summary.amount)}</strong>
            <strong className="text-primary">Đã thu: {formatMoney(summary.paid)}</strong>
          </div>
          <div style={{ display: "flex", gap: 40 }}>
            <strong className="text-primary">Còn nợ: {formatMoney(summary.remain)}</strong>
            <strong className="text-primary">Lợi nhuận: {formatMoney(summary.profit)}</strong>
          </div>
        </div>
      </div>

      <div className="pos-table">
        <table>
          <thead>
            <tr>
              <th>Số HĐ</th>
              <th>Ngày</th>
              <th>Nhân viên</th>
              <th>MH</th>
              <th>SL</th>
              <th>Tiền hàng</th>
              <th>Đã thu</th>
              <th>Lợi nhuận</th>
              <th>Nợ cũ</th>
              <th>Tổng cộng</th>
              <th>Còn nợ</th>
              <th>Khách hàng</th>
              <th>Điện thoại</th>
              <th>Địa chỉ</th>
              <th>Ghi chú</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr
                key={row.id}
                onClick={() => setSelectedInvoiceId(row.id)}
                style={{ cursor: "pointer" }}
              >
                <td>{row.code}</td>
                <td>{dayjs(row.date).format("DD/MM/YY HH:mm")}</td>
                <td>{row.staff}</td>
                <td>{row.itemsCount}</td>
                <td>{row.qtySum}</td>
                <td>{formatMoney(row.amount)}</td>
                <td className={row.paid > 0 ? "text-success" : ""}>
                  {formatMoney(row.paid)}
                </td>
                <td
                  className={row.profit >= 0 ? "text-success" : "text-danger"}
                >
                  {formatMoney(row.profit)}
                </td>
                <td className="text-danger">{formatMoney(row.oldDebt)}</td>
                <td>{formatMoney(row.totalPay)}</td>
                <td className={row.remain > 0 ? "text-danger" : "text-success"}>
                  {formatMoney(row.remain)}
                </td>
                <td>{row.customerName}</td>
                <td>{row.phone}</td>
                <td>{row.address}</td>
                <td>{row.note}</td>
              </tr>
            ))}
            {!rows.length && (
              <tr>
                <td colSpan={15} style={{ textAlign: "center" }}>
                  Chưa có hóa đơn.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <ReportSalesInvoiceModal
        open={!!selectedInvoice}
        invoice={selectedInvoice}
        customer={selectedCustomer}
        items={selectedItems}
        onClose={() => setSelectedInvoiceId(null)}
        onDelete={handleDelete}
        onEdit={handleEdit}
        onPrint={handlePrint}
        onExport={handleExport}
      />
    </div>
  );
};

export default ReportSalesInvoicesTab;
