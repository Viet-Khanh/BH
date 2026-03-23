import { useCallback, useEffect, useMemo, useState } from "react";
import { Modal, Pagination, Select, message } from "antd";
import dayjs from "dayjs";
import { useLocation, useNavigate } from "react-router-dom";
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

const buildDefaultRange = () => [dayjs().startOf("day").toISOString(), dayjs().endOf("day").toISOString()];

const parseDateParam = (value, fallback) => {
  if (value === null) return fallback;
  if (value === "") return null;
  const parsed = dayjs(value);
  return parsed.isValid() ? parsed.toISOString() : fallback;
};

const parsePositiveInt = (value, fallback) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : fallback;
};

const readFiltersFromSearch = (search) => {
  const params = new URLSearchParams(search);
  const [defaultFrom, defaultTo] = buildDefaultRange();
  const from = parseDateParam(params.get("from"), defaultFrom);
  const to = parseDateParam(params.get("to"), defaultTo);
  return {
    range: [from, to],
    customerId: params.get("customerId") || "",
    page: parsePositiveInt(params.get("page"), 1),
    pageSize: parsePositiveInt(params.get("pageSize"), 20),
  };
};

const isSameRange = (left = [], right = []) => left[0] === right[0] && left[1] === right[1];

const buildSummary = (items = [], { timelineMode = false } = {}) =>
  items.reduce(
    (acc, row) => {
      const isDebtReceipt = row.rowType === "debt_receipt";
      acc.amount += isDebtReceipt ? 0 : Number(row.amount || 0);
      acc.paid += Number(row.paid || 0);
      acc.remain += timelineMode ? 0 : Number(row.remain || 0);
      acc.profit += isDebtReceipt ? 0 : Number(row.profit || 0);
      return acc;
    },
    {
      amount: 0,
      paid: 0,
      remain: timelineMode && items.length ? Number(items[items.length - 1]?.remain || 0) : 0,
      profit: 0,
    }
  );

const EMPTY_DEBT_TIMELINE = {
  openingBalance: 0,
  closingBalance: 0,
  rows: [],
};

const buildExportRow = (row, { formatted = false, includeProfit = true } = {}) => {
  const isDebtReceipt = row.rowType === "debt_receipt";
  const blank = "";
  return {
    'Số HĐ': isDebtReceipt ? blank : row.code,
    Ngày: row.date ? dayjs(row.date).format('DD/MM/YYYY HH:mm') : '',
    'Nhân viên': isDebtReceipt ? blank : row.staff,
    'Mặt hàng': isDebtReceipt ? blank : row.itemsCount,
    'Số lượng': isDebtReceipt ? blank : row.qtySum,
    'Tiền hàng': isDebtReceipt ? blank : formatted ? formatMoney(row.amount) : row.amount,
    'Đã thu': formatted ? formatMoney(row.paid) : Number(row.paid || 0),
    ...(includeProfit
      ? { 'Lợi nhuận': isDebtReceipt ? blank : formatted ? formatMoney(row.profit) : row.profit }
      : {}),
    'Nợ cũ': formatted ? formatMoney(row.oldDebt) : Number(row.oldDebt || 0),
    'Tổng cộng': isDebtReceipt ? blank : formatted ? formatMoney(row.totalPay) : row.totalPay,
    'Còn nợ': formatted ? formatMoney(row.remain) : Number(row.remain || 0),
    'Khách hàng': isDebtReceipt ? blank : row.customerName,
    'Điện thoại': isDebtReceipt ? blank : row.phone,
    'Địa chỉ': isDebtReceipt ? blank : row.address,
    'Ghi chú': isDebtReceipt ? blank : row.note,
  };
};

const ReportSalesInvoicesTab = ({ showSensitiveInfo = false }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { settings, load: loadSettings } = useSettingsStore();
  const initialFilters = useMemo(() => readFiltersFromSearch(location.search), [location.search]);

  const [range, setRange] = useState(() => initialFilters.range);
  const [customerId, setCustomerId] = useState(() => initialFilters.customerId);
  const [rows, setRows] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [page, setPage] = useState(() => initialFilters.page);
  const [pageSize, setPageSize] = useState(() => initialFilters.pageSize);
  const [total, setTotal] = useState(0);
  const [debtTimeline, setDebtTimeline] = useState(EMPTY_DEBT_TIMELINE);
  const [debtTimelineLoading, setDebtTimelineLoading] = useState(false);
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

  useEffect(() => {
    const nextFilters = readFiltersFromSearch(location.search);
    setRange((prev) => (isSameRange(prev, nextFilters.range) ? prev : nextFilters.range));
    setCustomerId((prev) => (prev === nextFilters.customerId ? prev : nextFilters.customerId));
    setPage((prev) => (prev === nextFilters.page ? prev : nextFilters.page));
    setPageSize((prev) => (prev === nextFilters.pageSize ? prev : nextFilters.pageSize));
  }, [location.search]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    let changed = false;

    const setDateParam = (key, value) => {
      const normalized = value ? String(value) : "";
      const current = params.get(key);
      if (current !== normalized) {
        params.set(key, normalized);
        changed = true;
      }
    };

    const setParam = (key, value) => {
      const current = params.get(key);
      if (!value) {
        if (current !== null) {
          params.delete(key);
          changed = true;
        }
        return;
      }
      if (current !== value) {
        params.set(key, value);
        changed = true;
      }
    };

    setDateParam("from", range[0]);
    setDateParam("to", range[1]);
    setParam("customerId", customerId || "");
    setParam("page", String(page));
    setParam("pageSize", String(pageSize));

    if (!changed) return;

    const nextSearch = params.toString();
    navigate(
      {
        pathname: location.pathname,
        search: nextSearch ? `?${nextSearch}` : "",
      },
      { replace: true }
    );
  }, [range, customerId, page, pageSize, location.pathname, location.search, navigate]);

  const fetchReport = useCallback(async () => {
    const params = new URLSearchParams();
    if (range[0]) params.set("from", range[0]);
    if (range[1]) params.set("to", range[1]);
    if (customerId) params.set("customerId", customerId);
    params.set("page", String(page));
    params.set("pageSize", String(pageSize));
    const query = params.toString();

    const data = await apiRequest(`/reports/sales-invoices${query ? `?${query}` : ""}`);
    const rawRows = Array.isArray(data?.rows) ? data.rows : [];
    const rawCustomers = Array.isArray(data?.customers) ? data.customers : [];
    const pagination = data?.pagination || {};
    const filteredRows = rawRows;
    const filteredCustomers = rawCustomers;

    setRows(filteredRows);
    setCustomers(filteredCustomers);
    setTotal(Number(pagination.total || filteredRows.length || 0));
    if (pagination.page && Number(pagination.page) !== page) {
      setPage(Number(pagination.page));
    }
  }, [range, customerId, page, pageSize]);

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
    if (!customerId) {
      setDebtTimeline(EMPTY_DEBT_TIMELINE);
      setDebtTimelineLoading(false);
      return;
    }

    let active = true;
    setDebtTimeline(EMPTY_DEBT_TIMELINE);
    setDebtTimelineLoading(true);

    const loadDebtTimeline = async () => {
      try {
        const params = new URLSearchParams({ customerId });
        if (range[0]) params.set("from", range[0]);
        if (range[1]) params.set("to", range[1]);
        params.set("mode", "invoice-order");
        const data = await apiRequest(`/reports/customer-debt-timeline?${params.toString()}`);
        if (!active) return;
        setDebtTimeline({
          openingBalance: Number(data?.openingBalance || 0),
          closingBalance: Number(data?.closingBalance || 0),
          rows: Array.isArray(data?.rows) ? data.rows : [],
        });
      } catch (error) {
        if (active) {
          setDebtTimeline(EMPTY_DEBT_TIMELINE);
          message.error(`Không thể tải diễn biến công nợ: ${error.message || "Lỗi không xác định"}`);
        }
      } finally {
        if (active) {
          setDebtTimelineLoading(false);
        }
      }
    };

    loadDebtTimeline();

    return () => {
      active = false;
    };
  }, [customerId, range]);

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

  const displayRows = useMemo(() => {
    const invoiceRows = rows.map((row) => ({ ...row, rowType: "invoice" }));
    if (!customerId || !debtTimeline.rows.length) {
      return invoiceRows;
    }

    const invoiceRowsById = new Map(invoiceRows.map((row) => [row.id, row]));
    const timelineRows = debtTimeline.rows.filter(
      (row) => row.type === "invoice" || row.type === "debt_receipt"
    );
    if (!timelineRows.length) {
      return invoiceRows;
    }

    const mergedRows = [];
    let invoicePosition = 0;

    for (const timelineRow of timelineRows) {
      if (timelineRow.type === "invoice") {
        invoicePosition += 1;
        const invoiceId = String(timelineRow.id || "").replace(/^invoice:/, "");
        const invoiceRow = invoiceRowsById.get(invoiceId);
        if (invoiceRow) {
          mergedRows.push(invoiceRow);
        }
        continue;
      }

      const receiptPage = invoicePosition > 0 ? Math.ceil(invoicePosition / pageSize) : 1;
      if (receiptPage !== page) {
        continue;
      }

      mergedRows.push({
        id: timelineRow.id,
        rowType: "debt_receipt",
        date: timelineRow.date,
        paid: Number(timelineRow.paid || 0),
        oldDebt: Number(timelineRow.oldDebt || 0),
        remain: Number(timelineRow.remain || 0),
      });
    }

    return mergedRows.length ? mergedRows : invoiceRows;
  }, [customerId, debtTimeline.rows, page, pageSize, rows]);

  const summary = useMemo(
    () => buildSummary(displayRows, { timelineMode: Boolean(customerId) }),
    [customerId, displayRows]
  );

  const exportRows = useMemo(
    () =>
      displayRows.map((row) =>
        buildExportRow(row, {
          includeProfit: showSensitiveInfo,
        })
      ),
    [displayRows, showSensitiveInfo]
  );
  const pdfRows = useMemo(
    () =>
      displayRows.map((row) =>
        buildExportRow(row, {
          formatted: true,
          includeProfit: showSensitiveInfo,
        })
      ),
    [displayRows, showSensitiveInfo]
  );

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
    await printHtml(previewHtml, { copies: printCopies, autoPageSize: true });
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
    const params = new URLSearchParams(location.search);
    params.set("tab", "sales");
    const returnTo = `${location.pathname}?${params.toString()}`;
    navigate("/sales", {
      state: {
        editInvoiceId: selectedInvoice.id,
        returnTo,
      },
    });
  };

  return (
    <div>
      <div className="action-row">
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <span style={{ fontWeight: 600 }}>Theo ngày</span>
          <DateRangeFilter
            value={range}
            onChange={(nextRange) => {
              setRange(nextRange);
              setPage(1);
            }}
          />
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <span style={{ fontWeight: 600 }}>Khách hàng</span>
          <Select
            allowClear
            placeholder="Chọn khách hàng"
            value={customerId || undefined}
            onChange={(value) => {
              setCustomerId(value || "");
              setPage(1);
            }}
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

            {showSensitiveInfo && (
              <span className="text-gray-600">
                Lợi nhuận:{" "}
                <strong style={{ color: "purple" }} className="text-lg font-bold">
                  {formatMoney(summary.profit)}
                </strong>
              </span>
            )}
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
              <th>Nợ cũ</th>
              <th>Tổng cộng</th>
              <th>Còn nợ</th>
              {showSensitiveInfo && <th>Lợi nhuận</th>}
              <th>Khách hàng</th>
              <th>Điện thoại</th>
              <th>Địa chỉ</th>
              <th>Ghi chú</th>
            </tr>
          </thead>
          <tbody>
            {displayRows.map((row) => (
              <tr
                key={row.id}
                onClick={row.rowType === "invoice" ? () => setSelectedInvoiceId(row.id) : undefined}
                style={{
                  cursor: row.rowType === "invoice" ? "pointer" : "default",
                  background: row.rowType === "debt_receipt" ? "#fffbe6" : undefined,
                }}
              >
                <td>{row.rowType === "debt_receipt" ? "" : row.code}</td>
                <td>{dayjs(row.date).format("DD/MM/YY HH:mm")}</td>
                <td>{row.rowType === "debt_receipt" ? "" : row.staff}</td>
                <td>{row.rowType === "debt_receipt" ? "" : row.itemsCount}</td>
                <td>{row.rowType === "debt_receipt" ? "" : row.qtySum}</td>
                <td>{row.rowType === "debt_receipt" ? "" : formatMoney(row.amount)}</td>
                <td className={row.paid > 0 ? "text-success" : ""}>
                  {formatMoney(row.paid)}
                </td>
                <td className="text-danger">{formatMoney(row.oldDebt)}</td>
                <td>{row.rowType === "debt_receipt" ? "" : formatMoney(row.totalPay)}</td>
                <td className={row.remain > 0 ? "text-danger" : "text-success"}>
                  {formatMoney(row.remain)}
                </td>
                {showSensitiveInfo && (
                  <td
                    className={
                      row.rowType === "debt_receipt"
                        ? ""
                        : row.profit >= 0
                          ? "text-success"
                          : "text-danger"
                    }
                  >
                    {row.rowType === "debt_receipt" ? "" : formatMoney(row.profit)}
                  </td>
                )}
                <td>{row.rowType === "debt_receipt" ? "" : row.customerName}</td>
                <td>{row.rowType === "debt_receipt" ? "" : row.phone}</td>
                <td>{row.rowType === "debt_receipt" ? "" : row.address}</td>
                <td>{row.rowType === "debt_receipt" ? "" : row.note}</td>
              </tr>
            ))}
            {!displayRows.length && (
              <tr>
                <td colSpan={showSensitiveInfo ? 15 : 14} style={{ textAlign: "center" }}>
                  {debtTimelineLoading ? "Đang tải dữ liệu..." : "Chưa có hóa đơn."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 12 }}>
        <Pagination
          current={page}
          pageSize={pageSize}
          total={total}
          showSizeChanger
          pageSizeOptions={["10", "20", "50", "100"]}
          onChange={(nextPage, nextPageSize) => {
            const normalizedPageSize = Number(nextPageSize || pageSize);
            if (normalizedPageSize !== pageSize) {
              setPage(1);
              setPageSize(normalizedPageSize);
              return;
            }
            setPage(nextPage);
            setPageSize(normalizedPageSize);
          }}
          showTotal={(value) => `Tổng ${value} hóa đơn`}
        />
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
