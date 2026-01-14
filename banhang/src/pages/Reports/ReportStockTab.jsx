import { useCallback, useEffect, useMemo, useState } from 'react';
import { InputNumber, Modal, message } from 'antd';
import ExportActions from '../../components/ExportActions.jsx';
import { apiRequest, updateItem } from '../../db/repository.js';
import { formatMoney } from '../../utils/moneyFormat.js';

const ReportStockTab = () => {
  const [rows, setRows] = useState([]);
  const [lowStockThreshold, setLowStockThreshold] = useState(0);
  const [selectedItem, setSelectedItem] = useState(null);
  const [editingStock, setEditingStock] = useState(null);
  const [saving, setSaving] = useState(false);

  const loadStock = useCallback(async () => {
    const data = await apiRequest('/reports/stock');
    setRows(data?.rows || []);
    setLowStockThreshold(data?.lowStockThreshold ?? 0);
  }, []);

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        await loadStock();
      } catch (error) {
        if (active) {
          message.error(`Không thể tải tồn kho: ${error.message || 'Lỗi không xác định'}`);
        }
      }
    };
    load();
    return () => {
      active = false;
    };
  }, [loadStock]);

  const openEditor = (row) => {
    setSelectedItem(row);
    setEditingStock(Number(row.stock ?? 0));
  };

  const closeEditor = () => {
    if (saving) return;
    setSelectedItem(null);
    setEditingStock(null);
  };

  const handleSaveStock = async () => {
    if (!selectedItem) return;
    const nextStock = Number(editingStock ?? selectedItem.stock ?? 0);
    const currentStock = Number(selectedItem.stock ?? 0);
    const openingStock = Number(selectedItem.openingStock ?? 0);
    const nextOpeningStock = openingStock + (nextStock - currentStock);

    try {
      setSaving(true);
      await updateItem('products', selectedItem.id, { openingStock: nextOpeningStock });
      await loadStock();
      message.success('Đã cập nhật tồn kho.');
      setSelectedItem(null);
      setEditingStock(null);
    } catch (error) {
      message.error(`Không thể cập nhật tồn kho: ${error.message || 'Lỗi không xác định'}`);
    } finally {
      setSaving(false);
    }
  };

  const stockExport = useMemo(
    () =>
      rows.map((row) => ({
        San_pham: row.name,
        Nhom: row.group,
        Don_vi: row.unit,
        Ton: row.stock,
        Gia_von: row.avgCost,
        Gia_tri: row.value,
      })),
    [rows]
  );

  return (
    <div>
      <div className="action-row">
        <ExportActions rows={stockExport} fileName="ton-kho" sheetName="TonKho" title="Tồn kho" />
      </div>
      <div className="table-wrapper">
        <table className="invoice-items-table">
          <thead>
            <tr>
              <th>Sản phẩm</th>
              <th>Nhóm</th>
              <th>Đơn vị</th>
              <th>Tồn</th>
              <th>Giá vốn</th>
              <th>Giá trị</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr
                key={row.id}
                onClick={() => openEditor(row)}
                style={{
                  background: row.stock <= lowStockThreshold ? '#fff2e8' : 'transparent',
                  cursor: 'pointer',
                }}
              >
                <td>{row.name}</td>
                <td>{row.group}</td>
                <td>{row.unit}</td>
                <td>{row.stock}</td>
                <td>{formatMoney(row.avgCost)}</td>
                <td>{formatMoney(row.value)}</td>
              </tr>
            ))}
            {!rows.length && (
              <tr>
                <td colSpan={6}>Chưa có dữ liệu.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Modal
        title="Cập nhật tồn kho"
        open={!!selectedItem}
        onCancel={closeEditor}
        onOk={handleSaveStock}
        okText="Lưu"
        cancelText="Hủy"
        confirmLoading={saving}
      >
        {selectedItem && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div>
              Sản phẩm: <strong>{selectedItem.name}</strong>
            </div>
            <div>
              Tồn hiện tại: <strong>{selectedItem.stock}</strong>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <span style={{ fontWeight: 600 }}>Tồn mới</span>
              <InputNumber
                size="large"
                value={editingStock}
                onChange={setEditingStock}
                style={{ width: '100%' }}
              />
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default ReportStockTab;
