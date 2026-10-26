import mongoose from 'mongoose';

const InvoiceItemSchema = new mongoose.Schema(
  {
    productId: String,
    qty: Number,
    unitPrice: Number,
    lineTotal: Number,
    costPriceSnapshot: Number,
    excludeFromProfitSnapshot: Boolean,
    lineNote: String,
    length: Number,
    width: Number,
  },
  { _id: false }
);

const ChangeLogSchema = new mongoose.Schema(
  {
    date: String,
    note: String,
  },
  { _id: false }
);

const InvoiceSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true },
    code: String,
    customerId: String,
    date: String,
    items: [InvoiceItemSchema],
    subTotal: Number,
    discountTotal: Number,
    total: Number,
    paymentStatus: String,
    note: String,
    changeLog: [ChangeLogSchema],
    importBatchId: String,
    // Export state for manual e-invoice upload (modules/einvoice). Server-owned.
    einvoice: {
      exportedAt: String,
      exportBatchId: String,
      profile: String,
      number: String,
      series: String,
      taxAuthorityCode: String,
      lookupCode: String,
      changedAfterExport: Boolean,
      // Document as exported (compared with the current sale when it changes).
      snapshot: {},
      // Adjustment/replacement exports: { at, kind, batchId, original* }.
      adjustments: [{}],
    },
    isDeleted: { type: Boolean, default: false },
    deletedAt: String,
  },
  { versionKey: false }
);

export default mongoose.model('Invoice', InvoiceSchema);
