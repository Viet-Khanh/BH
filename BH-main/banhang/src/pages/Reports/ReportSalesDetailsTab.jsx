import { Fragment, useCallback, useEffect, useMemo, useState } from 'react';
import { Select, message } from 'antd';
import dayjs from 'dayjs';
import DateRangeFilter from '../../components/DateRangeFilter.jsx';
import ExportActions from '../../components/ExportActions.jsx';
import { apiRequest } from '../../db/repository.js';
import { formatMoney } from '../../utils/moneyFormat.js';

const isRetailCustomer = (name) => {
  const normalized = String(name || '').trim().toLowerCase();
  return normalized === 'khách lẻ' || normalized === 'khach le';
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

const buildDetailRow = (row, item, { formatted = false, includeInvoiceInfo = true } = {}) => {
  const invoiceFields = includeInvoiceInfo
    ? {
        'Số HĐ': row.code,
        Ngày: row.date ? dayjs(row.date).format('DD/MM/YYYY HH:mm') : '',
        'Nhân viên': row.staff,
        'Khách hàng': row.customerName,
        'Điện thoại': row.phone,
        'Địa chỉ': row.address,
        MH: row.itemsCount,
        'Tổng SL': row.qtySum,
        'Tiền hàng': formatted ? formatMoney(row.amount) : row.amount,
        'Đã thu': formatted ? formatMoney(row.paid) : row.paid,
        'Nợ cũ': formatted ? formatMoney(row.oldDebt) : row.oldDebt,
        'Tổng cộng': formatted ? formatMoney(row.totalPay) : row.totalPay,
        'Còn nợ': formatted ? formatMoney(row.remain) : row.remain,
        'Lợi nhuận': formatted ? formatMoney(row.profit) : row.profit,
        'Ghi chú': row.note,
      }
    : {
        'Số HĐ': '',
        Ngày: '',
        'Nhân viên': '',
        'Khách hàng': '',
        'Điện thoại': '',
        'Địa chỉ': '',
        MH: '',
        'Tổng SL': '',
        'Tiền hàng': '',
        'Đã thu': '',
        'Nợ cũ': '',
        'Tổng cộng': '',
        'Còn nợ': '',
        'Lợi nhuận': '',
        'Ghi chú': '',
      };

  return {
    ...invoiceFields,
    'Tên hàng': item?.name || '',
    ĐVT: item?.unit || '',
    'Quy cách': item?.spec || '',
    SL: item?.qty ?? '',
    'Đơn giá': formatted ? (item ? formatMoney(item.unitPrice ?? 0) : '') : item?.unitPrice ?? '',
    'Thành tiền': formatted ? (item ? formatMoney(item.lineTotal ?? 0) : '') : item?.lineTotal ?? '',
    'Ghi chú hàng': item?.note || '',
  };
};

const ReportSalesDetailsTab = () => {
  const [range, setRange] = useState(() => [
    dayjs().startOf('day').toISOString(),
    dayjs().endOf('day').toISOString(),
  ]);
  const [customerId, setCustomerId] = useState('');
  const [rows, setRows] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [summary, setSummary] = useState({
    amount: 0,
    paid: 0,
    remain: 0,
    profit: 0,
  });
  const selectedCustomerName = useMemo(
    () => customers.find((item) => item.id === customerId)?.name || '',
    [customers, customerId]
  );
  const exportTitle = selectedCustomerName
    ? `Báo cáo chi tiết bán hàng - Khách hàng: ${selectedCustomerName}`
    : 'Báo cáo chi tiết bán hàng';

  const fetchReport = useCallback(async () => {
    const params = new URLSearchParams();
    if (range[0]) params.set('from', range[0]);
    if (range[1]) params.set('to', range[1]);
    if (customerId) params.set('customerId', customerId);
    const query = params.toString();

    const data = await apiRequest(`/reports/sales-details${query ? `?${query}` : ''}`);
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
          message.error(`Không thể tải chi tiết bán hàng: ${error.message || 'Lỗi không xác định'}`);
        }
      }
    };
    load();
    return () => {
      active = false;
    };
  }, [fetchReport]);

  const exportRows = useMemo(
    () =>
      rows.flatMap((row) => {
        const items = row.items?.length ? row.items : [null];
        return items.map((item, index) =>
          buildDetailRow(row, item, { includeInvoiceInfo: index === 0 })
        );
      }),
    [rows]
  );

  const pdfRows = useMemo(
    () =>
      rows.flatMap((row) => {
        const items = row.items?.length ? row.items : [null];
        return items.map((item, index) =>
          buildDetailRow(row, item, { formatted: true, includeInvoiceInfo: index === 0 })
        );
      }),
    [rows]
  );

  return (
    <div>
      <div className="action-row">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <span style={{ fontWeight: 600 }}>Theo ngày</span>
          <DateRangeFilter value={range} onChange={setRange} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <span style={{ fontWeight: 600 }}>Khách hàng</span>
          <Select
            allowClear
            placeholder="Chọn khách hàng"
            value={customerId || undefined}
            onChange={(value) => setCustomerId(value || '')}
            options={customers.map((item) => ({ value: item.id, label: item.name }))}
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
            fileName="chi-tiet-ban-hang"
            sheetName="ChiTiet"
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
              Lợi nhuận:{' '}
              <strong style={{ color: 'purple' }} className="text-lg font-bold">
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
              <th colSpan={15} style={{ textAlign: 'center' }}>
                Thông tin hóa đơn
              </th>
              <th colSpan={7} style={{ textAlign: 'center' }}>
                Chi tiết hàng hóa
              </th>
            </tr>
            <tr>
              <th>Số HĐ</th>
              <th>Ngày</th>
              <th>Nhân viên</th>
              <th>Khách hàng</th>
              <th>Điện thoại</th>
              <th>Địa chỉ</th>
              <th>MH</th>
              <th>Tổng SL</th>
              <th>Tiền hàng</th>
              <th>Đã thu</th>
              <th>Nợ cũ</th>
              <th>Tổng cộng</th>
              <th>Còn nợ</th>
              <th>Lợi nhuận</th>
              <th>Ghi chú</th>
              <th>Tên hàng</th>
              <th>ĐVT</th>
              <th>SL</th>
              <th>Đơn giá</th>
              <th>Thành tiền</th>
              <th>Ghi chú hàng</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const items = row.items.length ? row.items : [null];
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
                            <td {...invoiceCellProps}>{dayjs(row.date).format('DD/MM/YY HH:mm')}</td>
                            <td {...invoiceCellProps}>{row.staff}</td>
                            <td {...invoiceCellProps}>{row.customerName}</td>
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
                            <td
                              {...invoiceCellProps}
                              className={row.profit >= 0 ? 'text-success' : 'text-danger'}
                            >
                              {formatMoney(row.profit)}
                            </td>
                            <td {...invoiceCellProps}>{row.note}</td>
                          </>
                        )}
                        {item ? (
                          <>
                            <td>{item.name}</td>
                            <td>{item.unit}</td>
                            <td>{item.qty}</td>
                            <td>{formatMoney(item.unitPrice)}</td>
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
            {!rows.length && (
              <tr>
                <td colSpan={22} style={{ textAlign: 'center' }}>
                  Chưa có hóa đơn.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ReportSalesDetailsTab;
