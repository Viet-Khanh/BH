import mongoose from 'mongoose';

const ProductSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true },
    group: String,
    code: String,
    name: String,
    unit: String,
    spec: String,
    avgCost: Number,
    sellPriceDefault: Number,
    sellPriceWholesale: Number,
    openingStock: Number,
    note: String,
    createdAt: String,
    isDeleted: { type: Boolean, default: false },
    deletedAt: String,
  },
  { versionKey: false }
);

export default mongoose.model('Product', ProductSchema);
