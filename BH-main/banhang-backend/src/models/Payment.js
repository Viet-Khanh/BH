import mongoose from 'mongoose';

const PaymentSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true },
    invoiceId: String,
    purchaseId: String,
    date: String,
    method: String,
    amount: Number,
    note: String,
    isDeleted: { type: Boolean, default: false },
    deletedAt: String,
  },
  { versionKey: false }
);

export default mongoose.model('Payment', PaymentSchema);
