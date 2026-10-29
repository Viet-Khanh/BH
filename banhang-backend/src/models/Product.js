import mongoose from 'mongoose';

// Packaging units over the base `unit` (see utils/productUnits.js).
const ProductUnitSchema = new mongoose.Schema(
  {
    name: String,
    factor: Number,
    sellPrice: Number,
  },
  { _id: false }
);

const ProductSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true },
    group: String,
    code: String,
    name: String,
    unit: String,
    units: { type: [ProductUnitSchema], default: [] },
    spec: String,
    avgCost: Number,
    sellPriceDefault: Number,
    sellPriceWholesale: Number,
    excludeFromProfit: { type: Boolean, default: false },
    vatRate: String,
    openingStock: Number,
    stock: {
      type: Number,
      default() {
        return Number(this.openingStock || 0);
      },
    },
    stockUpdatedAt: String,
    note: String,
    createdAt: String,
    isDeleted: { type: Boolean, default: false },
    deletedAt: String,
  },
  { versionKey: false }
);

export default mongoose.model('Product', ProductSchema);
