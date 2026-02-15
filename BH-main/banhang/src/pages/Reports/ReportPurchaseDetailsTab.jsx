import { Fragment, useCallback, useEffect, useMemo, useState } from 'react';
import { Select, message } from 'antd';
import dayjs from 'dayjs';
import DateRangeFilter from '../../components/DateRangeFilter.jsx';
import ExportActions from '../../components/ExportActions.jsx';
import { apiRequest } from '../../db/repository.js';
import { formatMoney } from '../../utils/moneyFormat.js';

const buildDetailRow = (group, item, { formatted = false, includeInvoiceInfo = true } = {}) => {
  const invoiceFields = includeInvoiceInfo
    ? {
        'Mã phiếu': group.code,
        Ngày: group.date,
        'Nhà cung cấp': group.supplierName,
      }
    : {
        'Mã phiếu': '',
        Ngày: '',
        'Nhà cung cấp': '',
      };

  return {
    ...invoiceFields,
    'Sản phẩm': item?.name || '',
    'Số lượng': item?.qty ?? '',
    'Đơn giá': formatted ? (item ? formatMoney(item.unitCost ?? 0) : '') : item?.unitCost ?? '',
    'Thành tiền': formatted ? (item ? formatMoney(item.lineTotal ?? 0) : '') : item?.lineTotal ?? '',
  };
};

const ReportPurchaseDetailsTab = () => {
  const [range, setRange] = useState(() => [
    dayjs().startOf('day').toISOString(),
    dayjs().endOf('day').toISOString(),
  ]);
  const [supplierId, setSupplierId] = useState('');
  const [detailRows, setDetailRows] = useState([]);
  const [suppliers, setSuppliers] = useState([]);

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
    const params = new URLSearchParams({ limit: '1000' });
    if (supplierId) params.set('supplierId', supplierId);
    if (range[0]) params.set('from', range[0]);
    if (range[1]) params.set('to', range[1]);
    const data = await apiRequest(`/purchases-tools/recent?${params.toString()}`);
    setDetailRows(Array.isArray(data?.exportRows) ? data.exportRows : []);
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
    const map = new Map();
    detailRows.forEach((row) => {
      const code = row.Ma_phieu || '';
      const date = row.Ngay || '';
      const supplierName = row.Nha_cung_cap || '';
      const key = `${code}__${date}__${supplierName}`;
      if (!map.has(key)) {
        map.set(key, {
          code,
          date,
          supplierName,
          items: [],
        });
      }
      map.get(key).items.push({
        name: row.San_pham || '',
        qty: row.So_luong ?? '',
        unitCost: row.Don_gia ?? '',
        lineTotal: row.Thanh_tien ?? '',
      });
    });
    return Array.from(map.values());
  }, [detailRows]);

  const exportRows = useMemo(
    () =>
      groupedRows.flatMap((group) => {
        const items = group.items.length ? group.items : [null];
        return items.map((item, index) =>
          buildDetailRow(group, item, { includeInvoiceInfo: index === 0 })
        );
      }),
    [groupedRows]
  );

  const pdfRows = useMemo(
    () =>
      groupedRows.flatMap((group) => {
        const items = group.items.length ? group.items : [null];
        return items.map((item, index) =>
          buildDetailRow(group, item, { formatted: true, includeInvoiceInfo: index === 0 })
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
      </div>

      <div className="pos-table">
        <table>
          <thead>
            <tr>
              <th>Mã phiếu</th>
              <th>Ngày</th>
              <th>Nhà cung cấp</th>
              <th>Sản phẩm</th>
              <th>Số lượng</th>
              <th>Đơn giá</th>
              <th>Thành tiền</th>
            </tr>
          </thead>
          <tbody>
            {groupedRows.map((group) => {
              const items = group.items.length ? group.items : [null];
              const rowSpan = items.length;
              const invoiceCellProps = {
                rowSpan,
                style: { verticalAlign: 'top', background: '#f9fbfb' },
              };

              return (
                <Fragment key={`${group.code}-${group.date}-${group.supplierName}`}>
                  {items.map((item, index) => {
                    const isFirst = index === 0;
                    return (
                      <tr key={`${group.code}-${item?.name || 'empty'}-${index}`}>
                        {isFirst && (
                          <>
                            <td {...invoiceCellProps}>{group.code}</td>
                            <td {...invoiceCellProps}>{group.date}</td>
                            <td {...invoiceCellProps}>{group.supplierName}</td>
                          </>
                        )}
                        <td>{item?.name || ''}</td>
                        <td>{item?.qty ?? ''}</td>
                        <td>{item ? formatMoney(item.unitCost ?? 0) : ''}</td>
                        <td>{item ? formatMoney(item.lineTotal ?? 0) : ''}</td>
                      </tr>
                    );
                  })}
                </Fragment>
              );
            })}
            {!groupedRows.length && (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center' }}>
                  Chưa có dữ liệu.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ReportPurchaseDetailsTab;
