import { Button, Modal, Select } from 'antd';
import dayjs from 'dayjs';
import DateRangeFilter from '../../components/DateRangeFilter.jsx';
import ExportButton from '../../components/ExportButton.jsx';
import { formatMoney } from '../../utils/moneyFormat.js';

const PurchaseRecentModal = ({
  open,
  onClose,
  filteredPurchases,
  suppliers,
  supplierOptions,
  filterRange,
  onFilterRangeChange,
  filterSupplier,
  onFilterSupplierChange,
  exportRows,
  onSelectDetail,
}) => (
  <Modal
    title="Phiếu nhập gần đây"
    open={open}
    onCancel={onClose}
    footer={null}
    width={900}
  >
    <div className="action-row" style={{ marginBottom: 12 }}>
      <DateRangeFilter value={filterRange} onChange={onFilterRangeChange} />
      <Select
        allowClear
        placeholder="Nhà cung cấp"
        value={filterSupplier || undefined}
        onChange={(value) => onFilterSupplierChange(value || '')}
        options={supplierOptions}
        style={{ minWidth: 220 }}
        showSearch
        optionFilterProp="label"
      />
      <ExportButton rows={exportRows} fileName="phieu-nhap" sheetName="PhieuNhap" />
    </div>
    <div className="table-wrapper">
      <table className="invoice-items-table">
        <thead>
          <tr>
            <th>Mã phiếu</th>
            <th>Ngày</th>
            <th>Nhà cung cấp</th>
            <th>Tổng tiền</th>
            <th>Ghi chú</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {filteredPurchases.map((purchase) => {
            const supplierItem = suppliers.find((s) => s.id === purchase.supplierId);
            return (
              <tr key={purchase.id}>
                <td>{purchase.code}</td>
                <td>{dayjs(purchase.date).format('DD/MM/YYYY')}</td>
                <td>{supplierItem?.name || ''}</td>
                <td>{formatMoney(purchase.total)}</td>
                <td>{purchase.note}</td>
                <td>
                  <Button onClick={() => onSelectDetail(purchase)}>Xem</Button>
                </td>
              </tr>
            );
          })}
          {!filteredPurchases.length && (
            <tr>
              <td colSpan={6}>Chưa có phiếu nhập.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  </Modal>
);

export default PurchaseRecentModal;
