import { useEffect, useMemo, useState } from 'react';
import { Button, Modal, message } from 'antd';
import dayjs from 'dayjs';
import ExportActions from '../../components/ExportActions.jsx';
import { apiRequest } from '../../db/repository.js';
import { formatMoney } from '../../utils/moneyFormat.js';

const ReportPurchaseDebtTab = () => {
  const [rows, setRows] = useState([]);
  const [debtDetail, setDebtDetail] = useState(null);

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const data = await apiRequest('/reports/supplier-debt');
        if (!active) return;
        setRows(data?.rows || []);
      } catch (error) {
        if (active) {
          message.error(`Không thể tải công nợ nhà cung cấp: ${error.message || 'Lỗi không xác định'}`);
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
        Nha_cung_cap: row.supplier?.name || '',
        Tong_nhap: row.total,
        Da_tra: row.paid,
        Con_no: row.debt,
      })),
    [rows]
  );

  const handleView = async (row) => {
    if (!row?.supplier?.id) return;
    try {
      const data = await apiRequest(`/reports/supplier-debt/${row.supplier.id}`);
      setDebtDetail(data);
    } catch (error) {
      message.error(`Không thể tải chi tiết công nợ: ${error.message || 'Lỗi không xác định'}`);
    }
  };

  return (
    <div>
      <div className="action-row">
        <ExportActions
          rows={debtExport}
          fileName="cong-no-nha-cung-cap"
          sheetName="CongNoNCC"
          title="Công nợ nhà cung cấp"
        />
      </div>
      <div className="table-wrapper">
        <table className="invoice-items-table">
          <thead>
            <tr>
              <th>Nhà cung cấp</th>
              <th>Tổng nhập</th>
              <th>Đã trả</th>
              <th>Còn nợ</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.supplier?.id || row.supplier?.name}>
                <td>{row.supplier?.name}</td>
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
        title="Chi tiết công nợ nhà cung cấp"
        open={!!debtDetail}
        onCancel={() => setDebtDetail(null)}
        footer={null}
      >
        {debtDetail && (
          <div>
            <div className="section-title">{debtDetail.supplier?.name}</div>
            <div className="table-wrapper">
              <table className="invoice-items-table">
                <thead>
                  <tr>
                    <th>Mã phiếu</th>
                    <th>Ngày</th>
                    <th>Tổng</th>
                    <th>Còn nợ</th>
                  </tr>
                </thead>
                <tbody>
                  {debtDetail.purchases?.map((purchase) => (
                    <tr key={purchase.id}>
                      <td>{purchase.code}</td>
                      <td>{dayjs(purchase.date).format('DD/MM/YYYY')}</td>
                      <td>{formatMoney(purchase.total)}</td>
                      <td>{formatMoney(purchase.remain)}</td>
                    </tr>
                  ))}
                  {!debtDetail.purchases?.length && (
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

export default ReportPurchaseDebtTab;
