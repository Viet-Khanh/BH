import mongoose from 'mongoose';

const PurchaseItemSchema = new mongoose.Schema(
  {
    productId: String,
    qty: Number,
    unitCost: Number,
    lineTotal: Number,
    lineNote: String,
    length: Number,
    width: Number,
  },
  { _id: false }
);

const PurchaseSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true },
    code: String,
    supplierId: String,
    date: String,
    items: [PurchaseItemSchema],
    total: Number,
    note: String,
    appliedToStock: { type: Boolean, default: false },
    isDeleted: { type: Boolean, default: false },
    deletedAt: String,
  },
  { versionKey: false }
);

export default mongoose.model('Purchase', PurchaseSchema);
