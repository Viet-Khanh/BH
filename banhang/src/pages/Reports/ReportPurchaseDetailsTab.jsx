import { Fragment, useCallback, useEffect, useMemo, useState } from 'react';
import { Pagination, Select, message } from 'antd';
import dayjs from 'dayjs';
import DateRangeFilter from '../../components/DateRangeFilter.jsx';
import ExportActions from '../../components/ExportActions.jsx';
import { apiRequest } from '../../db/repository.js';
import { formatMoney } from '../../utils/moneyFormat.js';

const normalizePurchaseRow = (row = {}, supplier = {}, items = []) => {
  const amount = Number(row.amount ?? row.total ?? 0);
  const paid = Number(row.paid ?? 0);
  const oldDebt = Number(row.oldDebt ?? 0);
  const totalPay = Number(row.totalPay ?? amount + oldDebt);
  const remain = Number(row.remain ?? totalPay - paid);
  const qtySumFromItems = items.reduce((sum, item) => sum + Number(item.qty || 0), 0);
  const normalizedDate = row.date || '';

  return {
    id: row.id || `${row.code || ''}-${normalizedDate}`,
    code: row.code || '',
    date: normalizedDate,
    staff: row.staff || '',
    supplierName: row.supplierName || supplier.name || '',
    phone: row.phone || supplier.phone || '',
    address: row.address || supplier.address || '',
    itemsCount: row.itemsCount ?? items.length,
    qtySum: row.qtySum ?? qtySumFromItems,
    amount,
    paid,
    oldDebt,
    totalPay,
    remain,
    note: row.note || '',
    items,
  };
};

const buildSummary = (rows = []) =>
  rows.reduce(
    (acc, row) => ({
      amount: acc.amount + Number(row.amount || 0),
      paid: acc.paid + Number(row.paid || 0),
      remain: acc.remain + Number(row.remain || 0),
      totalPay: acc.totalPay + Number(row.totalPay || 0),
    }),
    {
      amount: 0,
      paid: 0,
      remain: 0,
      totalPay: 0,
    }
  );

const buildDetailRow = (row, item, { formatted = false, includeInvoiceInfo = true } = {}) => {
  const invoiceFields = includeInvoiceInfo
    ? {
        'Số HĐ': row.code,
        Ngày: row.date ? dayjs(row.date).format('DD/MM/YYYY HH:mm') : '',
        'Nhân viên': row.staff || '',
        'Nhà cung cấp': row.supplierName || '',
        'Điện thoại': row.phone || '',
        'Địa chỉ': row.address || '',
        MH: row.itemsCount ?? '',
        'Tổng SL': row.qtySum ?? '',
        'Tiền hàng': formatted ? formatMoney(row.amount) : row.amount,
        'Đã thu': formatted ? formatMoney(row.paid) : row.paid,
        'Nợ cũ': formatted ? formatMoney(row.oldDebt) : row.oldDebt,
        'Tổng cộng': formatted ? formatMoney(row.totalPay) : row.totalPay,
        'Còn nợ': formatted ? formatMoney(row.remain) : row.remain,
        'Ghi chú': row.note || '',
      }
    : {
        'Số HĐ': '',
        Ngày: '',
        'Nhân viên': '',
        'Nhà cung cấp': '',
        'Điện thoại': '',
        'Địa chỉ': '',
        MH: '',
        'Tổng SL': '',
        'Tiền hàng': '',
        'Đã thu': '',
        'Nợ cũ': '',
        'Tổng cộng': '',
        'Còn nợ': '',
        'Ghi chú': '',
      };

  return {
    ...invoiceFields,
    'Tên hàng': item?.name || '',
    ĐVT: item?.unit || '',
    'Quy cách': item?.spec || '',
    SL: item?.qty ?? '',
    'Đơn giá': formatted ? (item ? formatMoney(item.unitCost ?? 0) : '') : item?.unitCost ?? '',
    'Thành tiền': formatted ? (item ? formatMoney(item.lineTotal ?? 0) : '') : item?.lineTotal ?? '',
    'Ghi chú hàng': item?.note || '',
  };
};

const ReportPurchaseDetailsTab = () => {
  const [range, setRange] = useState(() => [
    dayjs().startOf('day').toISOString(),
    dayjs().endOf('day').toISOString(),
  ]);
  const [supplierId, setSupplierId] = useState('');
  const [rows, setRows] = useState([]);
  const [detailRows, setDetailRows] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [total, setTotal] = useState(0);
  const [summary, setSummary] = useState({
    amount: 0,
    paid: 0,
    remain: 0,
    totalPay: 0,
  });

  useEffect(() => {
    let active = true;
    const loadSuppliers = async () => {
      try {
        const data = await apiRequest('/suppliers');
        if (active) {
          setSuppliers(Array.isArray(data) ? data : []);
        }
      } catch (error) {
        if (active) {
          message.error('Không thể tải danh sách nhà cung cấp.');
        }
      }
    };
    loadSuppliers();
    return () => {
      active = false;
    };
  }, []);

  const fetchReport = useCallback(async () => {
    const params = new URLSearchParams();
    if (supplierId) params.set('supplierId', supplierId);
    if (range[0]) params.set('from', range[0]);
    if (range[1]) params.set('to', range[1]);
    params.set('page', String(page));
    params.set('pageSize', String(pageSize));
    const data = await apiRequest(`/purchases-tools/recent?${params.toString()}`);
    const rawRows = Array.isArray(data?.rows) ? data.rows : [];
    const rawDetailRows = Array.isArray(data?.exportRows) ? data.exportRows : [];
    const backendSummary = data?.summary;
    const pagination = data?.pagination || {};

    setRows(rawRows);
    setDetailRows(rawDetailRows);
    setSummary(
      backendSummary
        ? {
            amount: Number(backendSummary.amount || 0),
            paid: Number(backendSummary.paid || 0),
            remain: Number(backendSummary.remain || 0),
            totalPay: Number(backendSummary.totalPay || 0),
          }
        : buildSummary(rawRows)
    );
    setTotal(Number(pagination.total || rawRows.length || 0));
    if (pagination.page && Number(pagination.page) !== page) {
      setPage(Number(pagination.page));
    }
  }, [range, supplierId, page, pageSize]);

  useEffect(() => {
    setPage(1);
  }, [range, supplierId]);

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        await fetchReport();
      } catch (error) {
        if (active) {
          message.error('Không thể tải chi tiết nhập hàng.');
        }
      }
    };
    load();
    return () => {
      active = false;
    };
  }, [fetchReport]);

  const supplierMap = useMemo(
    () =>
      suppliers.reduce((acc, supplier) => {
        acc[supplier.id] = supplier;
        return acc;
      }, {}),
    [suppliers]
  );

  const supplierOptions = useMemo(
    () => suppliers.map((item) => ({ value: item.id, label: item.name })),
    [suppliers]
  );

  const selectedSupplierName = useMemo(
    () => suppliers.find((item) => item.id === supplierId)?.name || '',
    [suppliers, supplierId]
  );

  const exportTitle = selectedSupplierName
    ? `Chi tiết nhập hàng - Nhà cung cấp: ${selectedSupplierName}`
    : 'Chi tiết nhập hàng';

  const groupedRows = useMemo(() => {
    const itemsByCode = {};
    detailRows.forEach((row) => {
      const code = row.Ma_phieu || '';
      if (!code) return;
      if (!itemsByCode[code]) itemsByCode[code] = [];
      itemsByCode[code].push({
        key: `${code}-${itemsByCode[code].length}`,
        name: row.San_pham || '',
        unit: row.DVT || '',
        spec: row.Quy_cach || '',
        qty: row.So_luong ?? '',
        unitCost: row.Don_gia ?? '',
        lineTotal: row.Thanh_tien ?? '',
        note: row.Ghi_chu_hang || '',
      });
    });

    const normalizedRows = rows.map((row) =>
      normalizePurchaseRow(row, supplierMap[row.supplierId] || {}, itemsByCode[row.code] || [])
    );

    const existingCodes = new Set(normalizedRows.map((row) => row.code));
    const fallbackRowsByCode = detailRows.reduce((acc, row) => {
      const code = row.Ma_phieu || '';
      if (!code || existingCodes.has(code)) return acc;
      if (!acc[code]) {
        acc[code] = {
          id: `fallback-${code}`,
          code,
          date: '',
          staff: '',
          supplierName: row.Nha_cung_cap || '',
          phone: '',
          address: '',
          itemsCount: 0,
          qtySum: 0,
          amount: 0,
          paid: 0,
          oldDebt: 0,
          totalPay: 0,
          remain: 0,
          note: '',
          items: [],
        };
      }
      const item = {
        key: `${code}-${acc[code].items.length}`,
        name: row.San_pham || '',
        unit: row.DVT || '',
        spec: row.Quy_cach || '',
        qty: row.So_luong ?? '',
        unitCost: row.Don_gia ?? '',
        lineTotal: row.Thanh_tien ?? '',
        note: row.Ghi_chu_hang || '',
      };
      acc[code].items.push(item);
      acc[code].itemsCount = acc[code].items.length;
      acc[code].qtySum += Number(item.qty || 0);
      acc[code].amount += Number(item.lineTotal || 0);
      acc[code].totalPay = acc[code].amount;
      return acc;
    }, {});

    return [...normalizedRows, ...Object.values(fallbackRowsByCode)];
  }, [rows, detailRows, supplierMap]);

  const exportRows = useMemo(
    () =>
      groupedRows.flatMap((row) => {
        const items = row.items?.length ? row.items : [null];
        return items.map((item, index) =>
          buildDetailRow(row, item, { includeInvoiceInfo: index === 0 })
        );
      }),
    [groupedRows]
  );

  const pdfRows = useMemo(
    () =>
      groupedRows.flatMap((row) => {
        const items = row.items?.length ? row.items : [null];
        return items.map((item, index) =>
          buildDetailRow(row, item, { formatted: true, includeInvoiceInfo: index === 0 })
        );
      }),
    [groupedRows]
  );

  return (
    <div>
      <div className="action-row">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <span style={{ fontWeight: 600 }}>Theo ngày</span>
          <DateRangeFilter value={range} onChange={setRange} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <span style={{ fontWeight: 600 }}>Nhà cung cấp</span>
          <Select
            allowClear
            placeholder="Chọn nhà cung cấp"
            value={supplierId || undefined}
            onChange={(value) => setSupplierId(value || '')}
            options={supplierOptions}
            style={{ minWidth: 220 }}
            size="large"
            showSearch
            optionFilterProp="label"
          />
        </div>
        <div style={{ display: 'flex', alignItems: 'end' }}>
          <ExportActions
            rows={exportRows}
            pdfRows={pdfRows}
            fileName="chi-tiet-nhap-hang"
            sheetName="ChiTietNhap"
            title={exportTitle}
          />
        </div>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            marginLeft: 'auto',
            justifyContent: 'flex-end',
            gap: 8,
          }}
        >
          <div style={{ display: 'flex', gap: 40 }}>
            <span className="text-gray-600">
              Tiền hàng:{' '}
              <strong style={{ color: 'blue' }} className="text-lg font-bold">
                {formatMoney(summary.amount)}
              </strong>
            </span>

            <span className="text-gray-600">
              Đã thu:{' '}
              <strong style={{ color: 'green' }} className="text-lg font-bold">
                {formatMoney(summary.paid)}
              </strong>
            </span>
          </div>

          <div style={{ display: 'flex', gap: 40 }}>
            <span className="text-gray-600">
              Còn nợ:{' '}
              <strong style={{ color: 'red' }} className="text-lg font-bold">
                {formatMoney(summary.remain)}
              </strong>
            </span>

            <span className="text-gray-600">
              Tổng cộng:{' '}
              <strong style={{ color: '#0f766e' }} className="text-lg font-bold">
                {formatMoney(summary.totalPay)}
              </strong>
            </span>
          </div>
        </div>
      </div>

      <div className="pos-table">
        <table>
          <thead>
            <tr>
              <th colSpan={14} style={{ textAlign: 'center' }}>
                Thông tin phiếu nhập
              </th>
              <th colSpan={7} style={{ textAlign: 'center' }}>
                Chi tiết hàng hóa
              </th>
            </tr>
            <tr>
              <th>Số HĐ</th>
              <th>Ngày</th>
              <th>Nhân viên</th>
              <th>Nhà cung cấp</th>
              <th>Điện thoại</th>
              <th>Địa chỉ</th>
              <th>MH</th>
              <th>Tổng SL</th>
              <th>Tiền hàng</th>
              <th>Đã thu</th>
              <th>Nợ cũ</th>
              <th>Tổng cộng</th>
              <th>Còn nợ</th>
              <th>Ghi chú</th>
              <th>Tên hàng</th>
              <th>ĐVT</th>
              <th>Quy cách</th>
              <th>SL</th>
              <th>Đơn giá</th>
              <th>Thành tiền</th>
              <th>Ghi chú hàng</th>
            </tr>
          </thead>
          <tbody>
            {groupedRows.map((row) => {
              const items = row.items?.length ? row.items : [null];
              const rowSpan = items.length;
              const invoiceCellProps = {
                rowSpan,
                style: { verticalAlign: 'top', background: '#f9fbfb' },
              };

              return (
                <Fragment key={row.id}>
                  {items.map((item, index) => {
                    const isFirst = index === 0;
                    return (
                      <tr key={item?.key ?? `${row.id}-empty-${index}`}>
                        {isFirst && (
                          <>
                            <td {...invoiceCellProps}>{row.code}</td>
                            <td {...invoiceCellProps}>
                              {row.date ? dayjs(row.date).format('DD/MM/YY HH:mm') : ''}
                            </td>
                            <td {...invoiceCellProps}>{row.staff}</td>
                            <td {...invoiceCellProps}>{row.supplierName}</td>
                            <td {...invoiceCellProps}>{row.phone}</td>
                            <td {...invoiceCellProps}>{row.address}</td>
                            <td {...invoiceCellProps}>{row.itemsCount}</td>
                            <td {...invoiceCellProps}>{row.qtySum}</td>
                            <td {...invoiceCellProps}>{formatMoney(row.amount)}</td>
                            <td
                              {...invoiceCellProps}
                              className={row.paid > 0 ? 'text-success' : ''}
                            >
                              {formatMoney(row.paid)}
                            </td>
                            <td {...invoiceCellProps} className="text-danger">
                              {formatMoney(row.oldDebt)}
                            </td>
                            <td {...invoiceCellProps}>{formatMoney(row.totalPay)}</td>
                            <td
                              {...invoiceCellProps}
                              className={row.remain > 0 ? 'text-danger' : 'text-success'}
                            >
                              {formatMoney(row.remain)}
                            </td>
                            <td {...invoiceCellProps}>{row.note}</td>
                          </>
                        )}
                        {item ? (
                          <>
                            <td>{item.name}</td>
                            <td>{item.unit}</td>
                            <td>{item.spec}</td>
                            <td>{item.qty}</td>
                            <td>{formatMoney(item.unitCost)}</td>
                            <td>{formatMoney(item.lineTotal)}</td>
                            <td>{item.note}</td>
                          </>
                        ) : (
                          <td colSpan={7} style={{ textAlign: 'center', color: '#7a8f8d' }}>
                            Chưa có hàng hóa.
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </Fragment>
              );
            })}
            {!groupedRows.length && (
              <tr>
                <td colSpan={21} style={{ textAlign: 'center' }}>
                  Chưa có dữ liệu.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 12 }}>
        <Pagination
          current={page}
          pageSize={pageSize}
          total={total}
          showSizeChanger
          pageSizeOptions={['10', '20', '50', '100']}
          onChange={(nextPage, nextPageSize) => {
            setPage(nextPage);
            setPageSize(nextPageSize);
          }}
          showTotal={(value) => `Tổng ${value} hóa đơn`}
        />
      </div>
    </div>
  );
};

export default ReportPurchaseDetailsTab;
