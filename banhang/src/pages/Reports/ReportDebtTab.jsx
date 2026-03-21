import { useCallback, useEffect, useMemo, useState } from 'react';
import { Button, DatePicker, Input, InputNumber, Modal, Select, Space, Tabs, message } from 'antd';
import dayjs from 'dayjs';
import ExportActions from '../../components/ExportActions.jsx';
import { apiRequest } from '../../db/repository.js';
import { formatMoney } from '../../utils/moneyFormat.js';
import { hasSearchMatch } from '../../utils/searchText.js';
import { formatNumberInput, parseNumberInput } from '../../utils/numberInput.js';
import { printHtml } from '../../utils/printUtils.js';
import { renderDebtReceiptTemplate } from '../../utils/renderDebtReceiptTemplate.js';
import { useSettingsStore } from '../../store/settingsStore.js';

const isRetailCustomer = (name) => {
  const normalized = String(name || '').trim().toLowerCase();
  return normalized === 'khách lẻ' || normalized === 'khach le';
};

const PAYMENT_METHOD_LABELS = {
  cash: 'Tiền mặt',
  bank: 'Chuyển khoản',
  other: 'Khác',
};

const formatPaymentMethod = (value) => PAYMENT_METHOD_LABELS[value] || value || '';

const ReportDebtTab = () => {
  const { settings, load: loadSettings } = useSettingsStore();
  const [rows, setRows] = useState([]);
  const [debtDetail, setDebtDetail] = useState(null);
  const [debtTimelineRows, setDebtTimelineRows] = useState([]);
  const [keyword, setKeyword] = useState('');
  const [editingDebtReceipt, setEditingDebtReceipt] = useState(null);
  const [editingDebtReceiptTimelineRow, setEditingDebtReceiptTimelineRow] = useState(null);
  const [editingDebtReceiptDate, setEditingDebtReceiptDate] = useState('');
  const [editingDebtReceiptAmount, setEditingDebtReceiptAmount] = useState(0);
  const [editingDebtReceiptMethod, setEditingDebtReceiptMethod] = useState('cash');
  const [editingDebtReceiptNote, setEditingDebtReceiptNote] = useState('');
  const [savingDebtReceipt, setSavingDebtReceipt] = useState(false);
  const [debtReceiptSubmitMode, setDebtReceiptSubmitMode] = useState('');
  const [deletingDebtReceiptId, setDeletingDebtReceiptId] = useState('');
  const [debtDetailTab, setDebtDetailTab] = useState('active');

  const loadDebtRows = useCallback(async () => {
    const data = await apiRequest('/reports/debt');
    const nextRows = Array.isArray(data?.rows) ? data.rows : [];
    setRows(nextRows);
    return nextRows;
  }, []);

  const loadDebtDetail = useCallback(async (customerId) => {
    if (!customerId) return null;
    const data = await apiRequest(`/reports/debt/${customerId}`);
    setDebtDetail(data);
    return data;
  }, []);

  const loadDebtTimeline = useCallback(async (customerId) => {
    if (!customerId) {
      setDebtTimelineRows([]);
      return [];
    }
    const data = await apiRequest(`/reports/customer-debt-timeline?customerId=${customerId}`);
    const nextRows = Array.isArray(data?.rows) ? data.rows : [];
    setDebtTimelineRows(nextRows);
    return nextRows;
  }, []);

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        await Promise.all([loadSettings(), loadDebtRows()]);
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
  }, [loadDebtRows, loadSettings]);

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
      await Promise.all([loadDebtDetail(row.customer.id), loadDebtTimeline(row.customer.id)]);
    } catch (error) {
      message.error(`Không thể tải chi tiết công nợ: ${error.message || 'Lỗi không xác định'}`);
    }
  };

  const handleCloseDebtDetail = () => {
    setDebtDetail(null);
    setDebtTimelineRows([]);
    setDebtDetailTab('active');
    resetEditingDebtReceipt();
  };

  const buildDebtReceiptTimelineRow = useCallback(
    (paymentId) =>
      debtTimelineRows.find((row) => row.id === `debt-receipt:${paymentId}`) || null,
    [debtTimelineRows]
  );

  const handlePrintDebtReceipt = useCallback(
    async ({ payment, customer, timelineRow }) => {
      if (!payment || !customer) return;
      const html = renderDebtReceiptTemplate({
        receipt: payment,
        customer,
        settings,
        debtBefore: Number(timelineRow?.oldDebt || 0),
      });
      const printCopies = Math.max(1, Math.round(Number(settings?.printCopies || 1)));
      await printHtml(html, { copies: printCopies, autoPageSize: true });
    },
    [settings]
  );

  const handleOpenEditDebtReceipt = (payment) => {
    const timelineRow = buildDebtReceiptTimelineRow(payment.id);
    setEditingDebtReceipt(payment);
    setEditingDebtReceiptTimelineRow(timelineRow);
    setEditingDebtReceiptDate(payment.date || new Date().toISOString());
    setEditingDebtReceiptAmount(Number(payment.amount || 0));
    setEditingDebtReceiptMethod(payment.method || 'cash');
    setEditingDebtReceiptNote(payment.note || '');
  };

  const resetEditingDebtReceipt = () => {
    setEditingDebtReceipt(null);
    setEditingDebtReceiptTimelineRow(null);
    setEditingDebtReceiptDate('');
    setEditingDebtReceiptAmount(0);
    setEditingDebtReceiptMethod('cash');
    setEditingDebtReceiptNote('');
    setDebtReceiptSubmitMode('');
  };

  const handleCloseEditDebtReceipt = () => {
    if (savingDebtReceipt) return;
    resetEditingDebtReceipt();
  };

  const handleReprintDebtReceipt = async (payment) => {
    const customerId = debtDetail?.customer?.id || payment?.customerId;
    if (!customerId || !payment) return;
    try {
      const timelineRows = await loadDebtTimeline(customerId);
      const timelineRow =
        timelineRows.find((row) => row.id === `debt-receipt:${payment.id}`) || null;
      await handlePrintDebtReceipt({
        payment,
        customer: debtDetail?.customer || null,
        timelineRow,
      });
    } catch (error) {
      message.error(`Không thể in lại phiếu thu nợ: ${error.message || 'Lỗi không xác định'}`);
    }
  };

  const handleSaveDebtReceipt = async ({ shouldPrint = false } = {}) => {
    if (!editingDebtReceipt?.id || !debtDetail?.customer?.id) return;
    const amount = Number(editingDebtReceiptAmount || 0);
    if (amount <= 0) {
      message.error('Số tiền thu nợ phải lớn hơn 0.');
      return;
    }

    setSavingDebtReceipt(true);
    setDebtReceiptSubmitMode(shouldPrint ? 'print' : 'save');
    try {
      const payload = {
        ...editingDebtReceipt,
        date: editingDebtReceiptDate || editingDebtReceipt.date,
        amount,
        method: editingDebtReceiptMethod || 'cash',
        note: editingDebtReceiptNote || '',
      };
      const updated = await apiRequest(`/payments/${editingDebtReceipt.id}`, {
        method: 'PUT',
        body: payload,
      });

      const [nextDetail, nextTimelineRows] = await Promise.all([
        loadDebtRows().then(() => loadDebtDetail(debtDetail.customer.id)),
        loadDebtTimeline(debtDetail.customer.id),
      ]);

      const nextPayment =
        nextDetail?.debtReceipts?.find((item) => item.id === editingDebtReceipt.id) || updated || payload;
      const nextTimelineRow =
        nextTimelineRows.find((row) => row.id === `debt-receipt:${editingDebtReceipt.id}`) || null;

      if (shouldPrint) {
        try {
          await handlePrintDebtReceipt({
            payment: nextPayment,
            customer: nextDetail?.customer || debtDetail.customer,
            timelineRow: nextTimelineRow,
          });
        } catch (error) {
          message.warning('Đã lưu phiếu thu nợ nhưng không thể in lại tự động.');
          resetEditingDebtReceipt();
          return;
        }
      }

      message.success(shouldPrint ? 'Đã cập nhật và in lại phiếu thu nợ.' : 'Đã cập nhật phiếu thu nợ.');
      resetEditingDebtReceipt();
    } catch (error) {
      message.error(`Không thể cập nhật phiếu thu nợ: ${error.message || 'Lỗi không xác định'}`);
    } finally {
      setSavingDebtReceipt(false);
      setDebtReceiptSubmitMode('');
    }
  };

  const handleDeleteDebtReceipt = (payment) => {
    const customerId = debtDetail?.customer?.id || payment?.customerId;
    if (!payment?.id || !customerId) return;

    Modal.confirm({
      title: 'Hủy phiếu thu nợ?',
      content: 'Phiếu thu nợ sẽ bị hủy và công nợ sẽ được tính lại như trước khi có phiếu này.',
      okText: 'Hủy phiếu',
      okButtonProps: { danger: true },
      cancelText: 'Không',
      onOk: async () => {
        setDeletingDebtReceiptId(payment.id);
        try {
          await apiRequest(`/payments/${payment.id}`, { method: 'DELETE' });
          await Promise.all([
            loadDebtRows(),
            loadDebtDetail(customerId),
            loadDebtTimeline(customerId),
          ]);
          message.success('Đã hủy phiếu thu nợ.');
        } catch (error) {
          message.error(`Không thể hủy phiếu thu nợ: ${error.message || 'Lỗi không xác định'}`);
          throw error;
        } finally {
          setDeletingDebtReceiptId('');
        }
      },
    });
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
        onCancel={handleCloseDebtDetail}
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
            <Tabs
              activeKey={debtDetailTab}
              onChange={setDebtDetailTab}
              tabPosition="top"
              items={[
                {
                  key: 'active',
                  label: `Phiếu thu nợ (${debtDetail.debtReceipts?.length || 0})`,
                  children: (
                    <div className="table-wrapper">
                      <table className="invoice-items-table">
                        <thead>
                          <tr>
                            <th>Mã phiếu</th>
                            <th>Ngày</th>
                            <th>Số tiền</th>
                            <th>Phương thức</th>
                            <th>Ghi chú</th>
                            <th></th>
                          </tr>
                        </thead>
                        <tbody>
                          {debtDetail.debtReceipts?.map((payment) => (
                            <tr key={payment.id}>
                              <td>{payment.code || payment.id}</td>
                              <td>{dayjs(payment.date).format('DD/MM/YYYY')}</td>
                              <td>{formatMoney(payment.amount)}</td>
                              <td>{formatPaymentMethod(payment.method)}</td>
                              <td>{payment.note}</td>
                              <td>
                                <Space size="small">
                                  <Button size="small" onClick={() => handleOpenEditDebtReceipt(payment)}>
                                    Sửa
                                  </Button>
                                  <Button size="small" onClick={() => handleReprintDebtReceipt(payment)}>
                                    In lại
                                  </Button>
                                  <Button
                                    danger
                                    size="small"
                                    loading={deletingDebtReceiptId === payment.id}
                                    onClick={() => handleDeleteDebtReceipt(payment)}
                                  >
                                    Hủy phiếu
                                  </Button>
                                </Space>
                              </td>
                            </tr>
                          ))}
                          {!debtDetail.debtReceipts?.length && (
                            <tr>
                              <td colSpan={6}>Chưa có phiếu thu nợ.</td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  ),
                },
                {
                  key: 'deleted',
                  label: `Đã hủy (${debtDetail.deletedDebtReceipts?.length || 0})`,
                  children: (
                    <div className="table-wrapper">
                      <table className="invoice-items-table">
                        <thead>
                          <tr>
                            <th>Mã phiếu</th>
                            <th>Ngày thu</th>
                            <th>Số tiền</th>
                            <th>Phương thức</th>
                            <th>Ghi chú</th>
                            <th>Ngày hủy</th>
                          </tr>
                        </thead>
                        <tbody>
                          {debtDetail.deletedDebtReceipts?.map((payment) => (
                            <tr key={payment.id}>
                              <td>{payment.code || payment.id}</td>
                              <td>{payment.date ? dayjs(payment.date).format('DD/MM/YYYY') : ''}</td>
                              <td>{formatMoney(payment.amount)}</td>
                              <td>{formatPaymentMethod(payment.method)}</td>
                              <td>{payment.note}</td>
                              <td>{payment.deletedAt ? dayjs(payment.deletedAt).format('DD/MM/YYYY HH:mm') : ''}</td>
                            </tr>
                          ))}
                          {!debtDetail.deletedDebtReceipts?.length && (
                            <tr>
                              <td colSpan={6}>Chưa có phiếu thu nợ đã hủy.</td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  ),
                },
              ]}
            />
          </div>
        )}
      </Modal>

      <Modal
        title="Sửa phiếu thu nợ"
        open={!!editingDebtReceipt}
        onCancel={handleCloseEditDebtReceipt}
        footer={null}
        destroyOnHidden
      >
        {editingDebtReceipt && (
          <div className="pos-payment">
            <div className="pos-payment-row">
              <span>Số phiếu:</span>
              <Input value={editingDebtReceipt.code || editingDebtReceipt.id} readOnly />
            </div>
            <div className="pos-payment-row">
              <span>Khách hàng:</span>
              <Input value={debtDetail?.customer?.name || ''} readOnly />
            </div>
            <div className="pos-payment-row">
              <span>Ngày thu:</span>
              <DatePicker
                style={{ width: '100%' }}
                value={editingDebtReceiptDate ? dayjs(editingDebtReceiptDate) : null}
                onChange={(value) =>
                  setEditingDebtReceiptDate(
                    value ? value.endOf('day').toISOString() : editingDebtReceipt.date || new Date().toISOString()
                  )
                }
                format="DD/MM/YYYY"
              />
            </div>
            <div className="pos-payment-row">
              <span>Số tiền thu:</span>
              <InputNumber
                style={{ width: '100%' }}
                min={0}
                value={editingDebtReceiptAmount}
                onChange={(value) => setEditingDebtReceiptAmount(Number(value || 0))}
                formatter={formatNumberInput}
                parser={parseNumberInput}
              />
            </div>
            <div className="pos-payment-row">
              <span>Phương thức:</span>
              <Select
                value={editingDebtReceiptMethod}
                onChange={setEditingDebtReceiptMethod}
                options={[
                  { value: 'cash', label: 'Tiền mặt' },
                  { value: 'bank', label: 'Chuyển khoản' },
                  { value: 'other', label: 'Khác' },
                ]}
              />
            </div>
            <div className="pos-payment-row">
              <span>Ghi chú:</span>
              <Input
                value={editingDebtReceiptNote}
                onChange={(event) => setEditingDebtReceiptNote(event.target.value)}
                placeholder="Nội dung thu nợ"
              />
            </div>
            <div className="pos-payment-row total">
              <span>Nợ cũ theo phiếu hiện tại:</span>
              <strong>{formatMoney(editingDebtReceiptTimelineRow?.oldDebt || 0)}</strong>
            </div>
            <div className="pos-payment-row total">
              <span>Còn lại theo phiếu hiện tại:</span>
              <strong>{formatMoney(editingDebtReceiptTimelineRow?.remain || 0)}</strong>
            </div>
            <div style={{ fontSize: 12, color: '#8c8c8c', marginTop: 4 }}>
              Khi sửa ngày hoặc số tiền, hệ thống sẽ tính lại công nợ và nợ cũ theo timeline sau khi lưu.
            </div>
            <div className="pos-payment-actions">
              <Button
                type="primary"
                className="btn-success"
                onClick={() => handleSaveDebtReceipt({ shouldPrint: true })}
                loading={savingDebtReceipt && debtReceiptSubmitMode === 'print'}
              >
                Lưu và in lại
              </Button>
              <Button
                type="primary"
                className="btn-primary"
                onClick={() => handleSaveDebtReceipt({ shouldPrint: false })}
                loading={savingDebtReceipt && debtReceiptSubmitMode === 'save'}
              >
                Lưu
              </Button>
              <Button onClick={handleCloseEditDebtReceipt} disabled={savingDebtReceipt}>
                Thoát
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default ReportDebtTab;
