import { useEffect, useMemo, useState } from 'react';
import { Button, DatePicker, Input, InputNumber, Select, message } from 'antd';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import { v4 as uuid } from 'uuid';
import { useCashbookStore } from '../../store/cashbookStore.js';
import { useInvoiceStore } from '../../store/invoiceStore.js';
import DateRangeFilter from '../../components/DateRangeFilter.jsx';
import ExportButton from '../../components/ExportButton.jsx';
import { formatMoney } from '../../utils/moneyFormat.js';

const Cashbook = () => {
  const navigate = useNavigate();
  const { items: cashbook, load: loadCashbook, add: addEntry } = useCashbookStore();
  const { items: invoices, load: loadInvoices } = useInvoiceStore();

  const [mode, setMode] = useState('list');
  const [date, setDate] = useState(new Date().toISOString());
  const [type, setType] = useState('in');
  const [amount, setAmount] = useState(0);
  const [category, setCategory] = useState('');
  const [note, setNote] = useState('');
  const [invoiceId, setInvoiceId] = useState('');
  const [filterRange, setFilterRange] = useState([null, null]);

  useEffect(() => {
    const bootstrap = async () => {
      await Promise.all([loadCashbook(), loadInvoices()]);
    };
    bootstrap();
  }, [loadCashbook, loadInvoices]);


  const filtered = useMemo(() => {
    return cashbook.filter((entry) => {
      const matchRange = filterRange[0] && filterRange[1]
        ? !dayjs(entry.date).isBefore(dayjs(filterRange[0]).startOf('day')) &&
          !dayjs(entry.date).isAfter(dayjs(filterRange[1]).endOf('day'))
        : true;
      return matchRange;
    });
  }, [cashbook, filterRange]);

  const exportRows = useMemo(() => {
    return filtered.map((entry) => ({
      Ngay: dayjs(entry.date).format('DD/MM/YYYY'),
      Loai: entry.type === 'in' ? 'Thu' : 'Chi',
      So_tien: entry.amount,
      Danh_muc: entry.category,
      Ghi_chu: entry.note,
      Hoa_don: entry.invoiceId || '',
    }));
  }, [filtered]);

  const handleSave = async () => {
    if (!amount || Number(amount) <= 0) {
      message.error('Số tiền > 0.');
      return;
    }
    const entry = {
      id: uuid(),
      date,
      type,
      amount: Number(amount),
      category,
      note,
      invoiceId: invoiceId || undefined,
    };
    await addEntry(entry);
    message.success('Đã lưu dòng thu/chi.');
    setMode('list');
    setDate(new Date().toISOString());
    setAmount(0);
    setCategory('');
    setNote('');
    setInvoiceId('');
  };

  return (
    <div className="page-card">
      <div className="page-title">Thu chi</div>
      <div className="action-row">
        <Button size="large" onClick={() => (mode === 'list' ? navigate('/') : setMode('list'))}>
          Quay lại
        </Button>
        {mode === 'list' && (
          <Button size="large" type="primary" className="btn-primary" onClick={() => setMode('new')}>
            Tạo mới
          </Button>
        )}
        {mode === 'new' && (
          <Button size="large" type="primary" className="btn-primary" onClick={handleSave}>
            Lưu
          </Button>
        )}
      </div>

      {mode === 'list' && (
        <div>
          <div className="flex-row" style={{ marginBottom: 12 }}>
            <DateRangeFilter value={filterRange} onChange={setFilterRange} />
            <ExportButton rows={exportRows} fileName="thu-chi" sheetName="ThuChi" />
          </div>
          <div className="table-wrapper">
            <table className="invoice-items-table">
              <thead>
                <tr>
                  <th>Ngày</th>
                  <th>Loại</th>
                  <th>Số tiền</th>
                  <th>Danh mục</th>
                  <th>Ghi chú</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((entry) => (
                  <tr key={entry.id}>
                    <td>{dayjs(entry.date).format('DD/MM/YYYY')}</td>
                    <td>{entry.type === 'in' ? 'Thu' : 'Chi'}</td>
                    <td>{formatMoney(entry.amount)}</td>
                    <td>{entry.category}</td>
                    <td>{entry.note}</td>
                  </tr>
                ))}
                {!filtered.length && (
                  <tr>
                    <td colSpan={5}>Chưa có dòng thu/chi.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {mode === 'new' && (
        <div className="form-grid">
          <div>
            <div className="section-title">Ngày</div>
            <DatePicker
              size="large"
              value={dayjs(date)}
              onChange={(val) => setDate(val?.toISOString() || new Date().toISOString())}
              style={{ width: '100%' }}
            />
          </div>
          <div>
            <div className="section-title">Loại</div>
            <Select
              size="large"
              value={type}
              onChange={setType}
              style={{ width: '100%' }}
              options={[
                { value: 'in', label: 'Thu' },
                { value: 'out', label: 'Chi' },
              ]}
            />
          </div>
          <div>
            <div className="section-title">Số tiền</div>
            <InputNumber
              size="large"
              min={0}
              value={amount}
              onChange={setAmount}
              style={{ width: '100%' }}
            />
          </div>
          <div>
            <div className="section-title">Danh mục</div>
            <Input size="large" value={category} onChange={(event) => setCategory(event.target.value)} />
          </div>
          <div>
            <div className="section-title">Liên kết hóa đơn (tùy chọn)</div>
            <Select
              size="large"
              allowClear
              value={invoiceId || undefined}
              onChange={(value) => setInvoiceId(value || '')}
              style={{ width: '100%' }}
              options={invoices.map((item) => ({ value: item.id, label: item.code }))}
            />
          </div>
          <div>
            <div className="section-title">Ghi chú</div>
            <Input size="large" value={note} onChange={(event) => setNote(event.target.value)} />
          </div>
        </div>
      )}
    </div>
  );
};

export default Cashbook;
