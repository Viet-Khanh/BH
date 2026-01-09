import mongoose from 'mongoose';

const UnitSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true },
    name: String,
    note: String,
    createdAt: String,
    isDeleted: { type: Boolean, default: false },
    deletedAt: String,
  },
  { versionKey: false }
);

export default mongoose.model('Unit', UnitSchema);
