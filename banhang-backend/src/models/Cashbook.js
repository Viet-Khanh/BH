import mongoose from 'mongoose';

const CashbookSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true },
    date: String,
    type: String,
    amount: Number,
    category: String,
    note: String,
    invoiceId: String,
    isDeleted: { type: Boolean, default: false },
    deletedAt: String,
  },
  { versionKey: false }
);

export default mongoose.model('Cashbook', CashbookSchema);
