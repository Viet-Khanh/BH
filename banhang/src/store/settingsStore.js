import { create } from 'zustand';
import { getSettings, saveSettings } from '../db/repository.js';

export const DEFAULT_TEMPLATE = `
<style>
  @page { size: A4; margin: 8mm 10mm; }
  body { margin: 0; font-family: Arial, sans-serif; color: #111; background: #fff; }
  .invoice { max-width: 780px; margin: 0 auto; padding: 4px 2px; font-size: 14px; line-height: 1.25; }
  .top { display: grid; grid-template-columns: 1fr 140px; gap: 10px; align-items: start; }
  .shop-wrap { display: flex; gap: 8px; }
  .logo-box {
    width: 82px;
    min-width: 82px;
    height: 46px;
    border: 1px solid #222;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 12px;
    font-weight: 700;
  }
  .shop-main { flex: 1; text-align: center; }
  .shop-name {
    font-size: 22px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: .4px;
    line-height: 1.15;
  }
  .shop-line { font-size: 14px; margin-top: 1px; }
  .meta { text-align: right; font-size: 14px; }
  .meta-line { margin-bottom: 2px; }
  .qr-box {
    width: 82px;
    height: 82px;
    margin-left: auto;
    border: 1px solid #222;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 12px;
    margin-top: 4px;
  }
  .divider { border-top: 1px solid #111; margin: 4px 0 6px; }
  .title { text-align: center; font-size: 18px; font-weight: 700; letter-spacing: .6px; margin-bottom: 6px; }
  .customer-row { display: flex; justify-content: space-between; gap: 12px; margin: 2px 0; }
  .customer-row > div { flex: 1; min-width: 0; }
  table.items { width: 100%; border-collapse: collapse; margin-top: 6px; font-size: 13px; }
  table.items th, table.items td { border: 1px solid #111; padding: 3px 4px; vertical-align: middle; }
  table.items th { text-align: center; font-weight: 700; }
  table.items th:nth-child(1), table.items td:nth-child(1) { width: 36px; text-align: center; }
  table.items th:nth-child(2), table.items td:nth-child(2) { width: auto; text-align: left; }
  table.items th:nth-child(3), table.items td:nth-child(3) { width: 52px; text-align: center; }
  table.items th:nth-child(4), table.items td:nth-child(4) { width: 64px; text-align: center; }
  table.items th:nth-child(5), table.items td:nth-child(5),
  table.items th:nth-child(6), table.items td:nth-child(6) { width: 52px; text-align: center; }
  table.items th:nth-child(7), table.items td:nth-child(7) { width: 72px; text-align: right; }
  table.items th:nth-child(8), table.items td:nth-child(8),
  table.items th:nth-child(9), table.items td:nth-child(9) { width: 110px; text-align: right; }
  table.items .item-code { font-size: 11px; color: #333; }
  table.items .item-note { font-size: 11px; font-style: italic; color: #222; margin-top: 2px; }
  .summary {
    margin-left: auto;
    margin-top: 10px;
    width: 320px;
    font-size: 14px;
  }
  .summary-row {
    display: grid;
    grid-template-columns: 1fr auto;
    gap: 12px;
    align-items: baseline;
    border-bottom: 1px dotted #444;
    padding: 2px 0;
  }
  .summary-row > span:first-child { text-align: right; }
  .summary-row > span:last-child { min-width: 120px; text-align: right; font-weight: 700; }
  .summary-row.total { font-size: 15px; font-weight: 700; }
  .summary-row:last-child { border-bottom: 0; }
  .invoice-note { margin-top: 4px; font-size: 13px; }
  .policy { text-align: center; font-size: 12px; margin-top: 8px; }
  .signatures { display: flex; justify-content: space-between; margin-top: 2px; }
  .sign-col { width: 42%; text-align: center; }
  .sign-title { font-size: 15px; font-weight: 700; margin-top: 3px; }
  .sign-sub { font-size: 13px; font-style: italic; margin-top: 3px; }
  .sign-space { height: 90px; }
  .footer { text-align: right; font-size: 11px; margin-top: 8px; }
</style>
<div class="invoice">
  <div class="top">
    <div class="shop-wrap">
      <div class="logo-box">LOGO</div>
      <div class="shop-main">
        <div class="shop-name">{{shop.name}}</div>
        <div class="shop-line">CHUYÊN NHÔM - XINGFA - PMA - SHALUMI - KÍNH - TRẦN THẢ - ALU CÁC LOẠI</div>
        <div class="shop-line">Địa chỉ: {{shop.address}}</div>
        <div class="shop-line">ĐT: {{shop.phone}}</div>
        <div class="shop-line">STK: ..........................................................</div>
      </div>
    </div>
    <div class="meta">
      <div class="meta-line"><strong>HD:</strong> {{invoice.code}}</div>
      <div class="meta-line"><strong>Ngày:</strong> {{date}}</div>
      <div class="qr-box">QR</div>
    </div>
  </div>
  <div class="divider"></div>
  <div class="title">HÓA ĐƠN BÁN HÀNG</div>
  <div class="customer-row">
    <div><strong>Khách hàng:</strong> {{customer.name}}</div>
    <div style="text-align: right;"><strong>Điện thoại:</strong> {{customer.phone}}</div>
  </div>
  <div class="customer-row">
    <div><strong>Địa chỉ:</strong> {{customer.address}}</div>
    <div></div>
  </div>
  {{items}}
  <div class="summary">
    <div class="summary-row">
      <span>Tiền hàng:</span>
      <span>{{total}}</span>
    </div>
    <div class="summary-row">
      <span>Nợ cũ:</span>
      <span>{{customer.debt}}</span>
    </div>
    <div class="summary-row total">
      <span>Tổng cộng:</span>
      <span>{{grand.total}}</span>
    </div>
    <div class="summary-row">
      <span>Thanh toán:</span>
      <span>{{paid.text}}</span>
    </div>
    <div class="summary-row total">
      <span>Còn lại:</span>
      <span>{{remaining}}</span>
    </div>
  </div>
  <div class="invoice-note"><strong>Ghi chú:</strong> {{note}}</div>
  <div class="policy">(Lưu ý: Khách hàng kiểm tra kỹ sau khi nhận hàng, mọi thắc mắc sau 2 ngày chúng tôi không giải quyết)</div>
  <div class="signatures">
    <div class="sign-col">
      <div class="sign-title">Người nhận hàng</div>
      <div class="sign-sub">(Ký, ghi rõ họ tên)</div>
      <div class="sign-space"></div>
    </div>
    <div class="sign-col">
      <div class="sign-title">Người giao hàng</div>
      <div class="sign-sub">(Ký, ghi rõ họ tên)</div>
      <div class="sign-space"></div>
    </div>
  </div>
  <div class="footer">Powered by THDP vn / Trang 1/1</div>
</div>
`;

export const DEFAULT_SETTINGS = {
  id: 'main',
  shopName: 'Cửa hàng nhôm kính',
  shopPhone: '0900 000 000',
  shopAddress: '123 Đường ABC, Quận 1',
  allowNegativeStock: false,
  lowStockThreshold: 5,
  printCopies: 1,
  invoiceTemplateHtml: DEFAULT_TEMPLATE,
};

const normalizeSettings = (data) => {
  const normalized = { ...DEFAULT_SETTINGS, ...(data || {}) };
  if (!normalized.invoiceTemplateHtml) {
    normalized.invoiceTemplateHtml = DEFAULT_TEMPLATE;
  }
  const copies = Number(normalized.printCopies || 0);
  normalized.printCopies =
    Number.isFinite(copies) && copies > 0 ? Math.round(copies) : DEFAULT_SETTINGS.printCopies;
  return normalized;
};

export const useSettingsStore = create((set, get) => ({
  settings: DEFAULT_SETTINGS,
  load: async () => {
    const data = await getSettings();
    if (data) {
      set({ settings: normalizeSettings(data) });
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
    const next = normalizeSettings({ ...get().settings, ...partial });
    await saveSettings(next);
    set({ settings: next });
  },
  reset: async () => {
    await saveSettings(DEFAULT_SETTINGS);
    set({ settings: DEFAULT_SETTINGS });
  },
}));
