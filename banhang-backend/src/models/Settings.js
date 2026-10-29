import mongoose from 'mongoose';

// Roll receipt designer default (mirrors FE features/printing/receipt/receiptLayout.js,
// which normalizes whatever is stored).
const defaultReceiptLayout = () => ({
  fontSizePx: 12,
  blocks: [
    { key: 'logo', on: false },
    { key: 'shop', on: true },
    { key: 'title', on: true, text: 'HOÁ ĐƠN BÁN HÀNG' },
    { key: 'meta', on: true },
    { key: 'customer', on: true },
    { key: 'items', on: true, style: 'twoLine' },
    { key: 'totals', on: true },
    { key: 'note', on: true },
    { key: 'qr', on: false },
    { key: 'barcode', on: false },
    { key: 'footer', on: true, text: 'Cảm ơn quý khách!' },
  ],
});

const SettingsSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true },
    shopName: String,
    shopPhone: String,
    shopAddress: String,
    // Shop bank account for the VietQR block of the roll receipt
    bankBin: { type: String, default: '' },
    bankAccountNo: { type: String, default: '' },
    bankAccountName: { type: String, default: '' },
    allowNegativeStock: Boolean,
    autoUpdateAvgCostOnPurchase: { type: Boolean, default: true },
    showSensitiveInfo: { type: Boolean, default: false },
    lowStockThreshold: Number,
    printCopies: { type: Number, default: 1 },
    invoiceTemplateHtml: String,
    systemPassword: { type: String, default: '123456' },
    dataVersion: { type: Number, default: 2 },
    // E-invoice export (modules/einvoice)
    taxMethod: String,
    sellerTaxCode: String,
    businessLocationCode: String,
    pricesIncludeVat: Boolean,
    defaultVatRate: String,
    einvoiceProfile: String,
    einvoiceAdjustProfile: String,
    einvoiceCustomProfiles: [{}],
    einvoiceStartDate: String,
    einvoiceReminder: Boolean,
    einvoiceLockExported: Boolean,
    einvoiceLookupUrl: String,
    // Printers and labels (FE features/printing)
    receiptPaper: { type: String, default: 'auto' },
    receiptPrinterName: { type: String, default: '' },
    receiptWidthMm: { type: Number, default: 58 },
    receiptMarginMm: { type: Number, default: 5 },
    // Plain object (Mixed): { fontSizePx, blocks: [{ key, on, text?, style? }] }
    receiptLayout: { type: Object, default: defaultReceiptLayout },
    receiptLogo: { type: String, default: '' }, // PNG data URL
    labelPrinterName: { type: String, default: '' },
    labelWidthMm: { type: Number, default: 35 },
    labelHeightMm: { type: Number, default: 22 },
    labelColumns: { type: Number, default: 2 },
    labelGapMm: { type: Number, default: 2 },
    labelOffsetXMm: { type: Number, default: 0 },
    labelOffsetYMm: { type: Number, default: 0 },
    labelShowShopName: { type: Boolean, default: true },
    labelShowPrice: { type: Boolean, default: true },
    autoPrintLabelsOnPurchase: { type: Boolean, default: true },
    stockDebtSnapshotAt: String,
    isDeleted: { type: Boolean, default: false },
    deletedAt: String,
  },
  { versionKey: false }
);

export default mongoose.model('Settings', SettingsSchema);
