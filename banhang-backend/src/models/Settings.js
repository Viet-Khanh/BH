import mongoose from 'mongoose';

const SettingsSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true },
    shopName: String,
    shopPhone: String,
    shopAddress: String,
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
