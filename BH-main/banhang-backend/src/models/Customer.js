import mongoose from 'mongoose';

const CustomerSchema = new mongoose.Schema(
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

export default mongoose.model('Customer', CustomerSchema);
