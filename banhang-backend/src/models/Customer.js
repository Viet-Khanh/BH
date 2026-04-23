import mongoose from 'mongoose';

const CustomerSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true },
    name: String,
    phone: String,
    address: String,
    currentDebt: { type: Number, default: 0 },
    debtUpdatedAt: String,
    importBatchId: String,
    isDeleted: { type: Boolean, default: false },
    deletedAt: String,
  },
  { versionKey: false }
);

export default mongoose.model('Customer', CustomerSchema);
