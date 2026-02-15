import { useEffect, useMemo, useState } from 'react';
import { Button, Modal, message } from 'antd';
import dayjs from 'dayjs';
import ExportActions from '../../components/ExportActions.jsx';
import { apiRequest } from '../../db/repository.js';
import { formatMoney } from '../../utils/moneyFormat.js';

const isRetailCustomer = (name) => {
  const normalized = String(name || '').trim().toLowerCase();
  return normalized === 'khách lẻ' || normalized === 'khach le';
};

const ReportDebtTab = () => {
  const [rows, setRows] = useState([]);
  const [debtDetail, setDebtDetail] = useState(null);

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const data = await apiRequest('/reports/debt');
        if (!active) return;
        const nextRows = (data?.rows || []).filter(
          (row) => !isRetailCustomer(row.customer?.name)
        );
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

  const debtExport = useMemo(
    () =>
      rows.map((row) => ({
        Khach_hang: row.customer?.name || '',
        Tong_ban: row.total,
        Da_thu: row.paid,
        Con_no: row.debt,
      })),
    [rows]
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
        <ExportActions rows={debtExport} fileName="cong-no" sheetName="CongNo" title="Công nợ" />
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
            {rows.map((row) => (
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
            {!rows.length && (
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
          </div>
        )}
      </Modal>
    </div>
  );
};

export default ReportDebtTab;
