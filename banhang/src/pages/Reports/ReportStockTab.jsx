import { useMemo } from 'react';
import { useProductStore } from '../../store/productStore.js';
import { usePurchaseStore } from '../../store/purchaseStore.js';
import { useInvoiceStore } from '../../store/invoiceStore.js';
import { useSettingsStore } from '../../store/settingsStore.js';
import ExportButton from '../../components/ExportButton.jsx';
import { computeStock } from '../../utils/computeStock.js';
import { formatMoney } from '../../utils/moneyFormat.js';

const ReportStockTab = () => {
  const { items: products } = useProductStore();
  const { items: purchases } = usePurchaseStore();
  const { items: invoices } = useInvoiceStore();
  const { settings } = useSettingsStore();

  const activeProducts = useMemo(() => products.filter((item) => !item.isDeleted), [products]);

  const stockRows = useMemo(() => {
    return activeProducts.map((product) => {
      const stock = computeStock(product.id, purchases, invoices, null, activeProducts);
      return {
        id: product.id,
        name: product.name,
        group: product.group,
        unit: product.unit,
        stock,
        avgCost: product.avgCost || 0,
        value: stock * Number(product.avgCost || 0),
      };
    });
  }, [activeProducts, purchases, invoices]);

  const stockExport = useMemo(
    () =>
      stockRows.map((row) => ({
        San_pham: row.name,
        Nhom: row.group,
        Don_vi: row.unit,
        Ton: row.stock,
        Gia_von: row.avgCost,
        Gia_tri: row.value,
      })),
    [stockRows]
  );

  return (
    <div>
      <div className="action-row">
        <ExportButton rows={stockExport} fileName="ton-kho" sheetName="TonKho" />
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
            {stockRows.map((row) => (
              <tr
                key={row.id}
                style={{
                  background:
                    row.stock <= (settings.lowStockThreshold || 0) ? '#fff2e8' : 'transparent',
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
            {!stockRows.length && (
              <tr>
                <td colSpan={6}>Chưa có dữ liệu.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ReportStockTab;
