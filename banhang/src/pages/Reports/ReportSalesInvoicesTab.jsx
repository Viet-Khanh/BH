import { useCallback, useEffect, useMemo, useState } from "react";
import { Modal, Select, message } from "antd";
import dayjs from "dayjs";
import { useNavigate } from "react-router-dom";
import * as XLSX from "xlsx";
import DateRangeFilter from "../../components/DateRangeFilter.jsx";
import ExportActions from "../../components/ExportActions.jsx";
import { apiRequest } from "../../db/repository.js";
import { formatMoney } from "../../utils/moneyFormat.js";
import { saveWorkbook } from "../../utils/excelExport.js";
import { printHtml } from "../../utils/printUtils.js";
import { renderInvoiceTemplate } from "../../utils/renderTemplate.js";
import ReportSalesInvoiceModal from "./ReportSalesInvoiceModal.jsx";
import { useSettingsStore } from "../../store/settingsStore.js";

const isRetailCustomer = (name) => {
  const normalized = String(name || "").trim().toLowerCase();
  return normalized === "khách lẻ" || normalized === "khach le";
};

const buildSummary = (items = []) =>
  items.reduce(
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
  );

const buildExportRow = (row, { formatted = false } = {}) => ({
  'Số HĐ': row.code,
  Ngày: row.date ? dayjs(row.date).format('DD/MM/YYYY HH:mm') : '',
  'Nhân viên': row.staff,
  'Mặt hàng': row.itemsCount,
  'Số lượng': row.qtySum,
  'Tiền hàng': formatted ? formatMoney(row.amount) : row.amount,
  'Đã thu': formatted ? formatMoney(row.paid) : row.paid,
  'Lợi nhuận': formatted ? formatMoney(row.profit) : row.profit,
  'Nợ cũ': formatted ? formatMoney(row.oldDebt) : row.oldDebt,
  'Tổng cộng': formatted ? formatMoney(row.totalPay) : row.totalPay,
  'Còn nợ': formatted ? formatMoney(row.remain) : row.remain,
  'Khách hàng': row.customerName,
  'Điện thoại': row.phone,
  'Địa chỉ': row.address,
  'Ghi chú': row.note,
});

const ReportSalesInvoicesTab = () => {
  const navigate = useNavigate();
  const { settings, load: loadSettings } = useSettingsStore();

  const [range, setRange] = useState(() => [
    dayjs().startOf("day").toISOString(),
    dayjs().endOf("day").toISOString(),
  ]);
  const [customerId, setCustomerId] = useState("");
  const [rows, setRows] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [summary, setSummary] = useState({
    amount: 0,
    paid: 0,
    remain: 0,
    profit: 0,
  });
  const [selectedInvoiceId, setSelectedInvoiceId] = useState(null);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [selectedItems, setSelectedItems] = useState([]);
  const [selectedPayments, setSelectedPayments] = useState([]);
  const [selectedProducts, setSelectedProducts] = useState([]);

  const selectedCustomerName = useMemo(
    () => customers.find((item) => item.id === customerId)?.name || '',
    [customers, customerId]
  );
  const exportTitle = selectedCustomerName
    ? `Báo cáo hóa đơn bán hàng - Khách hàng: ${selectedCustomerName}`
    : 'Báo cáo hóa đơn bán hàng';

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  const fetchReport = useCallback(async () => {
    const params = new URLSearchParams();
    if (range[0]) params.set("from", range[0]);
    if (range[1]) params.set("to", range[1]);
    if (customerId) params.set("customerId", customerId);
    const query = params.toString();

    const data = await apiRequest(`/reports/sales-invoices${query ? `?${query}` : ""}`);
    const rawRows = Array.isArray(data?.rows) ? data.rows : [];
    const rawCustomers = Array.isArray(data?.customers) ? data.customers : [];
    const filteredRows = rawRows.filter((row) => !isRetailCustomer(row.customerName));
    const filteredCustomers = rawCustomers.filter((item) => !isRetailCustomer(item.name));

    setRows(filteredRows);
    setSummary(buildSummary(filteredRows));
    setCustomers(filteredCustomers);
  }, [range, customerId]);

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        await fetchReport();
      } catch (error) {
        if (active) {
          message.error(`Không thể tải hóa đơn: ${error.message || "Lỗi không xác định"}`);
        }
      }
    };
    load();
    return () => {
      active = false;
    };
  }, [fetchReport]);

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
    const load = async () => {
      try {
        const data = await apiRequest(`/reports/invoices/${selectedInvoiceId}`);
        if (!active) return;
        setSelectedInvoice(data?.invoice || null);
        setSelectedCustomer(data?.customer || null);
        setSelectedItems(data?.items || []);
        setSelectedPayments(data?.payments || []);
        setSelectedProducts(data?.products || []);
      } catch (error) {
        if (active) {
          message.error(`Không thể tải chi tiết hóa đơn: ${error.message || "Lỗi không xác định"}`);
        }
      }
    };
    load();

    return () => {
      active = false;
    };
  }, [selectedInvoiceId]);

  const exportRows = useMemo(() => rows.map((row) => buildExportRow(row)), [rows]);
  const pdfRows = useMemo(() => rows.map((row) => buildExportRow(row, { formatted: true })), [rows]);

  const previewHtml = useMemo(() => {
    if (!selectedInvoice || !settings) return "";
    return renderInvoiceTemplate({
      template: settings.invoiceTemplateHtml,
      invoice: selectedInvoice,
      customer: selectedCustomer || { name: "Khách lẻ" },
      payments: selectedPayments,
      products: selectedProducts,
      settings,
    });
  }, [selectedInvoice, selectedCustomer, selectedPayments, selectedProducts, settings]);

  const handlePrint = async () => {
    if (!previewHtml) return;
    const printCopies = Math.max(1, Math.round(Number(settings?.printCopies || 1)));
    await printHtml(previewHtml, { copies: printCopies });
  };

  const handleExport = async () => {
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
    await saveWorkbook(workbook, selectedInvoice.code || "hoa-don");
  };

  const handleDelete = () => {
    if (!selectedInvoice) return;
    Modal.confirm({
      title: "Xóa hóa đơn?",
      content: "Thao tác này không thể hoàn tác.",
      okText: "Xóa",
      cancelText: "Hủy",
      onOk: async () => {
        try {
          await apiRequest(`/reports/invoices/${selectedInvoice.id}`, { method: "DELETE" });
          setSelectedInvoiceId(null);
          await fetchReport();
          message.success("Đã xóa hóa đơn.");
        } catch (error) {
          message.error(`Không thể xóa hóa đơn: ${error.message || "Lỗi không xác định"}`);
        }
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
            options={customers.map((item) => ({
              value: item.id,
              label: item.name,
            }))}
            style={{ minWidth: 220 }}
            size="large"
            showSearch
            optionFilterProp="label"
          />
        </div>
        <div style={{ display: "flex", alignItems: "end" }}>
          <ExportActions
            rows={exportRows}
            pdfRows={pdfRows}
            fileName="hoa-don-ban-hang"
            sheetName="HoaDon"
            title={exportTitle}
          />
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            marginLeft: "auto",
            justifyContent: "flex-end",
            gap: 8,
          }}
        >
          <div style={{ display: "flex", gap: 40 }}>
            <span className="text-gray-600">
              Tiền hàng:{" "}
              <strong style={{ color: "blue" }} className="text-lg font-bold">
                {formatMoney(summary.amount)}
              </strong>
            </span>

            <span className="text-gray-600">
              Đã thu:{" "}
              <strong style={{ color: "green" }} className="text-lg font-bold">
                {formatMoney(summary.paid)}
              </strong>
            </span>
          </div>

          <div style={{ display: "flex", gap: 40 }}>
            <span className="text-gray-600">
              Còn nợ:{" "}
              <strong style={{ color: "red" }} className="text-lg font-bold">
                {formatMoney(summary.remain)}
              </strong>
            </span>

            <span className="text-gray-600">
              Lợi nhuận:{" "}
              <strong style={{ color: "purple" }} className="text-lg font-bold">
                {formatMoney(summary.profit)}
              </strong>
            </span>
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
