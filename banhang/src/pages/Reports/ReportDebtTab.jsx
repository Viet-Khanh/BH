import { useEffect, useMemo, useState } from 'react';
import { Button, Input, Modal, message } from 'antd';
import dayjs from 'dayjs';
import ExportActions from '../../components/ExportActions.jsx';
import { apiRequest } from '../../db/repository.js';
import { formatMoney } from '../../utils/moneyFormat.js';
import { hasSearchMatch } from '../../utils/searchText.js';

const isRetailCustomer = (name) => {
  const normalized = String(name || '').trim().toLowerCase();
  return normalized === 'khách lẻ' || normalized === 'khach le';
};

const ReportDebtTab = () => {
  const [rows, setRows] = useState([]);
  const [debtDetail, setDebtDetail] = useState(null);
  const [keyword, setKeyword] = useState('');

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const data = await apiRequest('/reports/debt');
        if (!active) return;
        const nextRows = (data?.rows || []);
        setRows(nextRows);
      } catch (error) {
        if (active) {
          message.error(`Không thể tải công nợ: ${error.message || 'Lỗi không xác định'}`);
        }
      }
    };
    load();
    return () => {
      active = false;
    };
  }, []);

  const filteredRows = useMemo(
    () => rows.filter((row) => hasSearchMatch({ customerName: row.customer?.name }, keyword)),
    [rows, keyword]
  );

  const debtExport = useMemo(
    () =>
      filteredRows.map((row) => ({
        Khach_hang: row.customer?.name || '',
        Tong_ban: row.total,
        Thu_theo_hoa_don: row.invoicePaid,
        Thu_no_doc_lap: row.debtReceiptPaid,
        Da_thu: row.paid,
        Con_no: row.debt,
      })),
    [filteredRows]
  );

  const totals = useMemo(
    () =>
      filteredRows.reduce(
        (acc, row) => ({
          total: acc.total + Number(row.total || 0),
          paid: acc.paid + Number(row.paid || 0),
          debt: acc.debt + Number(row.debt || 0),
        }),
        { total: 0, paid: 0, debt: 0 }
      ),
    [filteredRows]
  );

  const summaryItems = useMemo(
    () => [
      { label: 'Tổng bán', value: formatMoney(totals.total), className: 'text-primary' },
      { label: 'Đã thu', value: formatMoney(totals.paid), className: 'text-success' },
      { label: 'Còn nợ', value: formatMoney(totals.debt), className: 'text-danger' },
    ],
    [totals]
  );

  const handleView = async (row) => {
    if (!row?.customer?.id) return;
    try {
      const data = await apiRequest(`/reports/debt/${row.customer.id}`);
      setDebtDetail(data);
    } catch (error) {
      message.error(`Không thể tải chi tiết công nợ: ${error.message || 'Lỗi không xác định'}`);
    }
  };

  return (
    <div>
      <div className="action-row">
        <Input
          allowClear
          size="large"
          placeholder="Tìm theo khách hàng"
          value={keyword}
          onChange={(event) => setKeyword(event.target.value)}
          style={{ maxWidth: 360 }}
        />
        <div style={{ marginLeft: 'auto' }}>
          <ExportActions
            rows={debtExport}
            fileName="cong-no"
            sheetName="CongNo"
            title="Công nợ"
            summaryItems={summaryItems}
          />
        </div>
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
            {filteredRows.map((row) => (
              <tr key={row.customer?.id || row.customer?.name}>
                <td>{row.customer?.name}</td>
                <td>{formatMoney(row.total)}</td>
                <td>{formatMoney(row.paid)}</td>
                <td>{formatMoney(row.debt)}</td>
                <td>
                  <Button onClick={() => handleView(row)}>Xem</Button>
                </td>
              </tr>
            ))}
            {!filteredRows.length && (
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
            <div className="section-title">{debtDetail.customer?.name}</div>
            <div style={{ marginBottom: 12 }}>
              <div>Tổng bán: <strong>{formatMoney(debtDetail.summary?.invoiceTotal || 0)}</strong></div>
              <div>Thu theo hóa đơn: <strong>{formatMoney(debtDetail.summary?.invoicePaid || 0)}</strong></div>
              <div>Thu nợ độc lập: <strong>{formatMoney(debtDetail.summary?.debtReceiptPaid || 0)}</strong></div>
              <div>Còn nợ: <strong>{formatMoney(debtDetail.summary?.debt || 0)}</strong></div>
            </div>
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
                  {debtDetail.invoices?.map((inv) => (
                    <tr key={inv.id}>
                      <td>{inv.code}</td>
                      <td>{dayjs(inv.date).format('DD/MM/YYYY')}</td>
                      <td>{formatMoney(inv.total)}</td>
                      <td>{formatMoney(inv.remain)}</td>
                    </tr>
                  ))}
                  {!debtDetail.invoices?.length && (
                    <tr>
                      <td colSpan={4}>Chưa có dữ liệu.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <div className="section-title" style={{ marginTop: 16 }}>Phiếu thu nợ</div>
            <div className="table-wrapper">
              <table className="invoice-items-table">
                <thead>
                  <tr>
                    <th>Ngày</th>
                    <th>Số tiền</th>
                    <th>Phương thức</th>
                    <th>Ghi chú</th>
                  </tr>
                </thead>
                <tbody>
                  {debtDetail.debtReceipts?.map((payment) => (
                    <tr key={payment.id}>
                      <td>{dayjs(payment.date).format('DD/MM/YYYY')}</td>
                      <td>{formatMoney(payment.amount)}</td>
                      <td>{payment.method}</td>
                      <td>{payment.note}</td>
                    </tr>
                  ))}
                  {!debtDetail.debtReceipts?.length && (
                    <tr>
                      <td colSpan={4}>Chưa có phiếu thu nợ.</td>
                    </tr>
                  )}
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
