import { useMemo, useState } from 'react';
import { Button, DatePicker, Input, Modal, Select, Space, message } from 'antd';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import { v4 as uuid } from 'uuid';
import { useSupplierStore } from '../../store/supplierStore.js';
import { useProductStore } from '../../store/productStore.js';
import { usePurchaseStore } from '../../store/purchaseStore.js';
import { useInvoiceStore } from '../../store/invoiceStore.js';
import PurchaseItemsTable from './PurchaseItemsTable.jsx';
import PurchaseSearchModal from './PurchaseSearchModal.jsx';
import PurchaseRecentModal from './PurchaseRecentModal.jsx';
import PurchaseDetailModal from './PurchaseDetailModal.jsx';
import { computeStock } from '../../utils/computeStock.js';
import { computeAvgCost } from '../../utils/computeAvgCost.js';
import { formatMoney } from '../../utils/moneyFormat.js';
import { generateCode } from '../../utils/codeGenerator.js';
import { hasSearchMatch, normalizeSearchText } from '../../utils/searchText.js';
const Purchases = () => {
  const navigate = useNavigate();
  const { items: suppliers } = useSupplierStore();
  const { items: products, update: updateProduct } = useProductStore();
  const { items: purchases, add: addPurchase } = usePurchaseStore();
  const { items: invoices } = useInvoiceStore();
  const [supplierId, setSupplierId] = useState('');
  const [date, setDate] = useState(new Date().toISOString());
  const [note, setNote] = useState('');
  const [items, setItems] = useState([]);
  const [draftCode, setDraftCode] = useState(generateCode('PO'));
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [recentOpen, setRecentOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detail, setDetail] = useState(null);
  const [filterRange, setFilterRange] = useState([null, null]);
  const [filterSupplier, setFilterSupplier] = useState('');
  const activeSuppliers = useMemo(
    () => suppliers.filter((item) => !item.isDeleted),
    [suppliers]
  );
  const supplierOptions = useMemo(
    () => activeSuppliers.map((item) => ({ value: item.id, label: item.name })),
    [activeSuppliers]
  );
  const activeProducts = useMemo(
    () => products.filter((item) => !item.isDeleted),
    [products]
  );
  const supplier = suppliers.find((item) => item.id === supplierId);
  const filteredPurchases = useMemo(() => {
    return purchases.filter((purchase) => {
      const matchSupplier = filterSupplier ? purchase.supplierId === filterSupplier : true;
      const matchRange = filterRange[0] && filterRange[1]
        ? !dayjs(purchase.date).isBefore(dayjs(filterRange[0]).startOf('day')) &&
          !dayjs(purchase.date).isAfter(dayjs(filterRange[1]).endOf('day'))
        : true;
      return matchSupplier && matchRange;
    });
  }, [purchases, filterSupplier, filterRange]);
  const exportRows = useMemo(() => {
    return filteredPurchases.flatMap((purchase) => {
      const supplierItem = suppliers.find((s) => s.id === purchase.supplierId);
      return (purchase.items || []).map((item) => {
        const product = products.find((p) => p.id === item.productId);
        return {
          Ma_phieu: purchase.code,
          Ngay: dayjs(purchase.date).format('DD/MM/YYYY'),
          Nha_cung_cap: supplierItem?.name || '',
          San_pham: product?.name || '',
          So_luong: item.qty,
          Don_gia: item.unitCost,
          Thanh_tien: item.lineTotal,
        };
      });
    });
  }, [filteredPurchases, suppliers, products]);
  const totals = useMemo(() => {
    return items.reduce((sum, item) => sum + Number(item.lineTotal || 0), 0);
  }, [items]);
  const totalQty = useMemo(
    () => items.reduce((sum, item) => sum + Number(item.qty || 0), 0),
    [items]
  );
  const handleAddProduct = (productId) => {
    const product = activeProducts.find((item) => item.id === productId);
    if (!product) return;
    const existing = items.find((item) => item.productId === productId);
    if (existing) {
      setItems(
        items.map((item) => {
          if (item.productId !== productId) return item;
          const qty = Number(item.qty || 0) + 1;
          const lineTotal = qty * Number(item.unitCost || 0);
          return { ...item, qty, lineTotal };
        })
      );
      return;
    }
    const newItem = {
      productId,
      qty: 1,
      unitCost: Number(product.avgCost || 0),
      lineTotal: Number(product.avgCost || 0),
      lineNote: '',
    };
    setItems([...items, newItem]);
  };
  const updateItem = (index, field, value) => {
    const next = [...items];
    const item = { ...next[index], [field]: value };
    const qty = Number(item.qty || 0);
    const unitCost = Number(item.unitCost || 0);
    item.lineTotal = qty * unitCost;
    next[index] = item;
    setItems(next);
  };
  const removeItem = (index) => {
    const next = [...items];
    next.splice(index, 1);
    setItems(next);
  };
  const resetForm = () => {
    setSupplierId('');
    setDate(new Date().toISOString());
    setNote('');
    setItems([]);
    setDraftCode(generateCode('PO'));
  };
  const handleSave = async () => {
    if (!supplierId) {
      message.error('Chọn nhà cung cấp.');
      return;
    }
    if (!items.length) {
      message.error('Chọn hàng hóa.');
      return;
    }
    const invalid = items.find((item) => Number(item.qty || 0) <= 0 || Number(item.unitCost || 0) < 0);
    if (invalid) {
      message.error('Số lượng > 0 và đơn giá >= 0.');
      return;
    }

    const purchase = {
      id: uuid(),
      code: draftCode,
      supplierId,
      date,
      items,
      total: totals,
      note,
      appliedToStock: true,
    };

    for (const item of items) {
      const product = products.find((p) => p.id === item.productId);
      if (!product) continue;
      const oldQty = computeStock(product.id, purchases, invoices, null, products);
      const newAvgCost = computeAvgCost(oldQty, product.avgCost || 0, item.qty, item.unitCost);
      const nextOpeningStock = Number(product.openingStock || 0) + Number(item.qty || 0);
      await updateProduct(product.id, { avgCost: newAvgCost, openingStock: nextOpeningStock });
    }

    await addPurchase(purchase);
    message.success('Đã lưu phiếu nhập.');
    resetForm();
  };
  const handleCancelTicket = () => {
    Modal.confirm({
      title: 'Hủy phiếu hiện tại?',
      content: 'Dữ liệu chưa lưu sẽ bị xóa.',
      okText: 'Hủy phiếu',
      cancelText: 'Giữ lại',
      onOk: () => resetForm(),
    });
  };
  const filteredQuick = useMemo(() => {
    const key = normalizeSearchText(searchKeyword);
    if (!key) return [];
    return activeProducts
      .filter((item) => hasSearchMatch(item, key))
      .slice(0, 5);
  }, [searchKeyword, activeProducts]);

  const handleQuickAdd = () => {
    if (!filteredQuick.length) {
      setSearchOpen(true);
      return;
    }
    handleAddProduct(filteredQuick[0].id);
    setSearchKeyword('');
  };

  return (
    <div className="page-card pos-shell">
      <div className="pos-header">
        <Button size="large" onClick={() => navigate('/')}
        >
          F5 - Quay lại
        </Button>
        <div className="pos-header-title">NHẬP HÀNG</div>
        <div className="pos-header-actions">
          <Space wrap>
            <Button size="large" onClick={() => setRecentOpen(true)}>
              Phiếu gần đây
            </Button>
          </Space>
        </div>
      </div>

      <div className="pos-top">
        <div className="pos-info-box">
          <div className="pos-info-row">Phiếu: <strong>{draftCode}</strong></div>
          <div className="pos-info-row">
            Ngày:
            <DatePicker
              value={dayjs(date)}
              onChange={(val) => setDate(val?.toISOString() || new Date().toISOString())}
            />
          </div>
          <div className="pos-info-row">NV: <strong>admin</strong></div>
          <div className="pos-actions-row">
            <Button danger onClick={handleCancelTicket}>F3 - Hủy phiếu</Button>
            <Button type="primary" className="btn-primary" onClick={resetForm}>
              F2 - Tạo phiếu
            </Button>
            <Button type="primary" className="btn-primary" onClick={handleSave}>
              F6 - Lưu
            </Button>
          </div>
        </div>

        <div className="pos-summary">
          <div className="pos-summary-row">
            <span>Tổng MH:</span>
            <strong>{items.length}</strong>
          </div>
          <div className="pos-summary-row">
            <span>Tổng SL:</span>
            <strong>{totalQty.toFixed(1)}</strong>
          </div>
          <div className="pos-summary-row total">
            <span>Tổng tiền:</span>
            <strong>{formatMoney(totals)}</strong>
          </div>
        </div>

        <div className="pos-info-box">
          <div className="pos-info-row">
            <span>Nhà cung cấp:</span>
            <Select
              value={supplierId}
              onChange={setSupplierId}
              style={{ width: '100%' }}
              options={activeSuppliers.map((item) => ({
                value: item.id,
                label: item.name,
              }))}
              showSearch
              optionFilterProp="label"
            />
          </div>
          <div className="pos-info-row">
            <span>SĐT:</span>
            <Input value={supplier?.phone || ''} readOnly />
          </div>
          <div className="pos-info-row">
            <span>Địa chỉ:</span>
            <Input value={supplier?.address || ''} readOnly />
          </div>
          <div className="pos-info-row">
            <span>Ghi chú:</span>
            <Input value={note} onChange={(event) => setNote(event.target.value)} />
          </div>
        </div>
      </div>

      <div className="pos-search">
        <Space wrap>
          <Input
            placeholder="Gõ mã hoặc tên hàng..."
            value={searchKeyword}
            onChange={(event) => setSearchKeyword(event.target.value)}
            onPressEnter={handleQuickAdd}
            style={{ minWidth: 260 }}
          />
          <Button size="large" onClick={() => setSearchOpen(true)}>
            Tìm kiếm
          </Button>
        </Space>
        {filteredQuick.length > 0 && (
          <div className="pos-quick-list">
            {filteredQuick.map((item) => (
              <button
                key={item.id}
                type="button"
                className="product-option"
                onClick={() => handleAddProduct(item.id)}
              >
                <div><strong>{item.name}</strong></div>
                <div>{item.code || '---'} · {item.unit}</div>
              </button>
            ))}
          </div>
        )}
      </div>

      <PurchaseItemsTable
        items={items}
        products={products}
        onUpdateItem={updateItem}
        onRemoveItem={removeItem}
      />

      <PurchaseSearchModal
        open={searchOpen}
        onClose={() => setSearchOpen(false)}
        products={activeProducts}
        onAddProduct={handleAddProduct}
      />

      <PurchaseRecentModal
        open={recentOpen}
        onClose={() => setRecentOpen(false)}
        filteredPurchases={filteredPurchases}
        suppliers={suppliers}
        supplierOptions={supplierOptions}
        filterRange={filterRange}
        onFilterRangeChange={setFilterRange}
        filterSupplier={filterSupplier}
        onFilterSupplierChange={setFilterSupplier}
        exportRows={exportRows}
        onSelectDetail={(purchase) => {
          setDetail(purchase);
          setDetailOpen(true);
        }}
      />

      <PurchaseDetailModal
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
        detail={detail}
        products={products}
      />
    </div>
  );
};

export default Purchases;
