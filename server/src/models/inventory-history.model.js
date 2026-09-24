import mongoose from 'mongoose';

const inventoryHistorySchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true, index: true },
    previousStock: { type: Number, required: true, min: 0 },
    changeAmount: { type: Number, required: true },
    newStock: { type: Number, required: true, min: 0 },
    reason: {
      type: String,
      enum: ['initial-stock', 'admin-adjustment', 'order-placed', 'order-cancelled'],
      required: true,
    },
    changedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true },
);

export const InventoryHistory = mongoose.model('InventoryHistory', inventoryHistorySchema);
