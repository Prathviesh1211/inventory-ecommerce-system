import mongoose from 'mongoose';

const orderSchema = new mongoose.Schema(
  {
    orderNumber: { type: String, required: true, unique: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    items: [{ type: mongoose.Schema.Types.ObjectId, ref: 'OrderItem' }],
    totalAmount: { type: Number, required: true, min: 0 },
    status: {
      type: String,
      enum: ['Placed', 'Processing', 'Shipped', 'Delivered', 'Cancelled'],
      default: 'Placed',
    },
  },
  { timestamps: true },
);

export const Order = mongoose.model('Order', orderSchema);
