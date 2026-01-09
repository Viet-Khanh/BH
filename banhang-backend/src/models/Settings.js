import mongoose from 'mongoose';

const SettingsSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true },
    shopName: String,
    shopPhone: String,
    shopAddress: String,
    allowNegativeStock: Boolean,
    lowStockThreshold: Number,
    invoiceTemplateHtml: String,
    isDeleted: { type: Boolean, default: false },
    deletedAt: String,
  },
  { versionKey: false }
);

export default mongoose.model('Settings', SettingsSchema);
