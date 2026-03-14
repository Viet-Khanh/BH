import mongoose from 'mongoose';

const SettingsSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true },
    shopName: String,
    shopPhone: String,
    shopAddress: String,
    allowNegativeStock: Boolean,
    showSensitiveInfo: { type: Boolean, default: false },
    lowStockThreshold: Number,
    printCopies: { type: Number, default: 1 },
    invoiceTemplateHtml: String,
    systemPassword: { type: String, default: '123456' },
    isDeleted: { type: Boolean, default: false },
    deletedAt: String,
  },
  { versionKey: false }
);

export default mongoose.model('Settings', SettingsSchema);
