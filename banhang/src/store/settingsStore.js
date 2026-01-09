import { create } from 'zustand';
import { getSettings, saveSettings } from '../db/repository.js';

export const DEFAULT_TEMPLATE = `
<style>
  body { font-family: 'Be Vietnam Pro', Arial, sans-serif; color: #222; }
  .invoice { padding: 16px; font-size: 14px; }
  .header { display: flex; justify-content: space-between; gap: 12px; }
  .shop-name { font-size: 20px; font-weight: 700; }
  h2 { text-align: center; margin: 16px 0; }
  .info-grid { display: flex; gap: 16px; margin-top: 12px; }
  .info-box { flex: 1; border: 1px solid #eee; padding: 8px; }
  .info-row { display: flex; justify-content: space-between; gap: 8px; margin-bottom: 4px; }
  table.items { width: 100%; border-collapse: collapse; margin-top: 12px; }
  table.items th, table.items td { border: 1px solid #ddd; padding: 6px; vertical-align: top; }
  table.items th { background: #f2f2f2; }
  .total { margin-top: 12px; font-weight: 700; display: flex; gap: 16px; justify-content: space-between; }
  .total div { margin-bottom: 4px; }
</style>
<div class="invoice">
  <div class="header">
    <div>
      <div class="shop-name">{{shop.name}}</div>
      <div>{{shop.address}}</div>
      <div>SĐT: {{shop.phone}}</div>
    </div>
    <div>
      <div>Hóa đơn: <strong>{{invoice.code}}</strong></div>
      <div>Ngày: {{date}}</div>
      <div>NV: {{staff}}</div>
    </div>
  </div>
  <h2>HÓA ĐƠN BÁN HÀNG</h2>
  <div class="info-grid">
    <div class="info-box">
      <div class="info-row"><span>Tổng MH:</span><strong>{{items.count}}</strong></div>
      <div class="info-row"><span>Tổng SL:</span><strong>{{items.qty}}</strong></div>
      <div class="info-row"><span>Nợ cũ:</span><strong>{{customer.debt}}</strong></div>
      <div class="info-row"><span>Tổng tiền:</span><strong>{{total}}</strong></div>
    </div>
    <div class="info-box">
      <div class="info-row"><span>Khách hàng:</span><strong>{{customer.name}}</strong></div>
      <div class="info-row"><span>Điện thoại:</span><span>{{customer.phone}}</span></div>
      <div class="info-row"><span>Địa chỉ:</span><span>{{customer.address}}</span></div>
      <div class="info-row"><span>Ghi chú:</span><span>{{note}}</span></div>
    </div>
  </div>
  {{items}}
  <div class="total">
    <div>Tổng cộng: {{total}}</div>
    <div>Đã thu: {{paid}}</div>
    <div>Còn nợ: {{debt}}</div>
  </div>
</div>
`;

export const DEFAULT_SETTINGS = {
  id: 'main',
  shopName: 'Cửa hàng nhôm kính',
  shopPhone: '0900 000 000',
  shopAddress: '123 Đường ABC, Quận 1',
  allowNegativeStock: false,
  lowStockThreshold: 5,
  invoiceTemplateHtml: DEFAULT_TEMPLATE,
};

export const useSettingsStore = create((set, get) => ({
  settings: DEFAULT_SETTINGS,
  load: async () => {
    const data = await getSettings();
    if (data) {
      const normalized = { ...DEFAULT_SETTINGS, ...data };
      if (!normalized.invoiceTemplateHtml) {
        normalized.invoiceTemplateHtml = DEFAULT_TEMPLATE;
      }
      set({ settings: normalized });
    }
  },
  ensureDefaults: async () => {
    const data = await getSettings();
    if (!data) {
      await saveSettings(DEFAULT_SETTINGS);
      set({ settings: DEFAULT_SETTINGS });
    }
  },
  update: async (partial) => {
    const next = { ...get().settings, ...partial };
    if (!next.invoiceTemplateHtml) {
      next.invoiceTemplateHtml = DEFAULT_TEMPLATE;
    }
    await saveSettings(next);
    set({ settings: next });
  },
  reset: async () => {
    await saveSettings(DEFAULT_SETTINGS);
    set({ settings: DEFAULT_SETTINGS });
  },
}));
