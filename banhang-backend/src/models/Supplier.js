import mongoose from 'mongoose';

const SupplierSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true },
    name: String,
    phone: String,
    address: String,
    isDeleted: { type: Boolean, default: false },
    deletedAt: String,
  },
  { versionKey: false }
);

export default mongoose.model('Supplier', SupplierSchema);
