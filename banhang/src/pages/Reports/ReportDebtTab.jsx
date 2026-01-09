import { useMemo, useState } from 'react';
import { Button, Modal } from 'antd';
import dayjs from 'dayjs';
import { useInvoiceStore } from '../../store/invoiceStore.js';
import { usePaymentStore } from '../../store/paymentStore.js';
import { useCustomerStore } from '../../store/customerStore.js';
import ExportButton from '../../components/ExportButton.jsx';
import { formatMoney } from '../../utils/moneyFormat.js';

const ReportDebtTab = () => {
  const { items: invoices } = useInvoiceStore();
  const { items: payments } = usePaymentStore();
  const { items: customers } = useCustomerStore();

  const [debtDetail, setDebtDetail] = useState(null);

  const activeCustomers = useMemo(
    () => customers.filter((item) => !item.isDeleted),
    [customers]
  );

  const debtRows = useMemo(() => {
    return activeCustomers.map((customer) => {
      const customerInvoices = invoices.filter((inv) => inv.customerId === customer.id);
      const openInvoices = customerInvoices.filter((inv) => inv.paymentStatus !== 'DA THU');
      const total = customerInvoices.reduce((sum, inv) => sum + Number(inv.total || 0), 0);
      const paid = customerInvoices.reduce((sum, inv) => {
        const invoicePaid = payments
          .filter((p) => p.invoiceId === inv.id)
          .reduce((acc, p) => acc + Number(p.amount || 0), 0);
        return sum + invoicePaid;
      }, 0);
      const debt = total - paid;
      return { customer, total, paid, debt, invoices: openInvoices };
    });
  }, [activeCustomers, invoices, payments]);

  const debtExport = useMemo(
    () =>
      debtRows.map((row) => ({
        Khach_hang: row.customer.name,
        Tong_ban: row.total,
        Da_thu: row.paid,
        Con_no: row.debt,
      })),
    [debtRows]
  );

  return (
    <div>
      <div className="action-row">
        <ExportButton rows={debtExport} fileName="cong-no" sheetName="CongNo" />
      </div>
      <div className="table-wrapper">
        <table className="invoice-items-table">
          <thead>
            <tr>
              <th>Khách hàng</th>
              <th>Tổng bán</th>
              <th>Đã thu</th>
              <th>Còn nợ</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {debtRows.map((row) => (
              <tr key={row.customer.id}>
                <td>{row.customer.name}</td>
                <td>{formatMoney(row.total)}</td>
                <td>{formatMoney(row.paid)}</td>
                <td>{formatMoney(row.debt)}</td>
                <td>
                  <Button onClick={() => setDebtDetail(row)}>Xem</Button>
                </td>
              </tr>
            ))}
            {!debtRows.length && (
              <tr>
                <td colSpan={5}>Chưa có dữ liệu.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Modal
        title="Chi tiết công nợ"
        open={!!debtDetail}
        onCancel={() => setDebtDetail(null)}
        footer={null}
      >
        {debtDetail && (
          <div>
            <div className="section-title">{debtDetail.customer.name}</div>
            <div className="table-wrapper">
              <table className="invoice-items-table">
                <thead>
                  <tr>
                    <th>Mã HĐ</th>
                    <th>Ngày</th>
                    <th>Tổng</th>
                    <th>Còn nợ</th>
                  </tr>
                </thead>
                <tbody>
                  {debtDetail.invoices.map((inv) => {
                    const paid = payments
                      .filter((p) => p.invoiceId === inv.id)
                      .reduce((sum, p) => sum + Number(p.amount || 0), 0);
                    const remain = Number(inv.total || 0) - paid;
                    return (
                      <tr key={inv.id}>
                        <td>{inv.code}</td>
                        <td>{dayjs(inv.date).format('DD/MM/YYYY')}</td>
                        <td>{formatMoney(inv.total)}</td>
                        <td>{formatMoney(remain)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default ReportDebtTab;
