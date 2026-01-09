import { Fragment, useMemo, useState } from 'react';
import { Select } from 'antd';
import dayjs from 'dayjs';
import { useInvoiceStore } from '../../store/invoiceStore.js';
import { usePaymentStore } from '../../store/paymentStore.js';
import { useCustomerStore } from '../../store/customerStore.js';
import { useProductStore } from '../../store/productStore.js';
import DateRangeFilter from '../../components/DateRangeFilter.jsx';
import { formatMoney } from '../../utils/moneyFormat.js';
import {
  buildCustomerMap,
  buildInvoiceItems,
  buildInvoiceSummary,
  buildOldDebtByInvoice,
  buildPaymentsByInvoice,
  buildProductMap,
} from './reportSalesUtils.js';

const ReportSalesDetailsTab = () => {
  const { items: invoices } = useInvoiceStore();
  const { items: payments } = usePaymentStore();
  const { items: customers } = useCustomerStore();
  const { items: products } = useProductStore();

  const [range, setRange] = useState(() => [
    dayjs().startOf("day").toISOString(),
    dayjs().endOf("day").toISOString(),
  ]);
  const [customerId, setCustomerId] = useState('');

  const activeCustomers = useMemo(
    () => customers.filter((item) => !item.isDeleted),
    [customers]
  );
  const customerMap = useMemo(() => buildCustomerMap(customers), [customers]);
  const productMap = useMemo(() => buildProductMap(products), [products]);
  const paymentsByInvoice = useMemo(() => buildPaymentsByInvoice(payments), [payments]);
  const oldDebtByInvoice = useMemo(
    () => buildOldDebtByInvoice(invoices, paymentsByInvoice),
    [invoices, paymentsByInvoice]
  );

  const filteredInvoices = useMemo(() => {
    return invoices.filter((invoice) => {
      const matchCustomer = customerId ? invoice.customerId === customerId : true;
      const matchRange = range[0] && range[1]
        ? !dayjs(invoice.date).isBefore(dayjs(range[0]).startOf('day')) &&
          !dayjs(invoice.date).isAfter(dayjs(range[1]).endOf('day'))
        : true;
      return matchCustomer && matchRange;
    });
  }, [invoices, customerId, range]);

  const rows = useMemo(() => {
    const sorted = [...filteredInvoices].sort((a, b) => new Date(b.date) - new Date(a.date));
    return sorted.map((invoice) => ({
      ...buildInvoiceSummary(invoice, {
        customerMap,
        productMap,
        paymentsByInvoice,
        oldDebtByInvoice,
      }),
      items: buildInvoiceItems(invoice, productMap),
    }));
  }, [filteredInvoices, customerMap, productMap, paymentsByInvoice, oldDebtByInvoice]);

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
            options={activeCustomers.map((item) => ({ value: item.id, label: item.name }))}
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
              <Fragment key={row.id}>
                <tr>
                  <td>{row.code}</td>
                  <td>{dayjs(row.date).format('DD/MM/YY HH:mm')}</td>
                  <td>{row.staff}</td>
                  <td>{row.itemsCount}</td>
                  <td>{row.qtySum}</td>
                  <td>{formatMoney(row.amount)}</td>
                  <td className={row.paid > 0 ? 'text-success' : ''}>{formatMoney(row.paid)}</td>
                  <td className={row.profit >= 0 ? 'text-success' : 'text-danger'}>
                    {formatMoney(row.profit)}
                  </td>
                  <td className="text-danger">{formatMoney(row.oldDebt)}</td>
                  <td>{formatMoney(row.totalPay)}</td>
                  <td className={row.remain > 0 ? 'text-danger' : 'text-success'}>
                    {formatMoney(row.remain)}
                  </td>
                  <td>{row.customerName}</td>
                  <td>{row.phone}</td>
                  <td>{row.address}</td>
                  <td>{row.note}</td>
                </tr>
                <tr>
                  <td colSpan={15} style={{ padding: 0 , paddingLeft: 100 }}>
                    <div className="table-wrapper" style={{ padding: 12 }}>
                      <table className="invoice-items-table">
                        <thead>
                          <tr>
                            <th>Tên hàng</th>
                            <th>ĐVT</th>
                            <th>Quy cách</th>
                            <th>T.SL</th>
                            <th>Đơn giá</th>
                            <th>Thành tiền</th>
                            <th>Ghi chú</th>
                          </tr>
                        </thead>
                        <tbody>
                          {row.items.map((item) => (
                            <tr key={item.key}>
                              <td>{item.name}</td>
                              <td>{item.unit}</td>
                              <td>{item.spec}</td>
                              <td>{item.qty}</td>
                              <td>{formatMoney(item.unitPrice)}</td>
                              <td>{formatMoney(item.lineTotal)}</td>
                              <td>{item.note}</td>
                            </tr>
                          ))}
                          {!row.items.length && (
                            <tr>
                              <td colSpan={7} style={{ textAlign: 'center' }}>
                                Chưa có hàng hóa.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </td>
                </tr>
              </Fragment>
            ))}
            {!rows.length && (
              <tr>
                <td colSpan={15} style={{ textAlign: 'center' }}>
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
