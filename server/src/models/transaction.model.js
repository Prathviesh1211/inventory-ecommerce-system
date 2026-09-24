import mongoose from 'mongoose';

const transactionSchema = new mongoose.Schema(
  {
    order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true, unique: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    amount: { type: Number, required: true, min: 0 },
    paymentMethod: { type: String, default: 'Not Applicable' },
    paymentStatus: { type: String, default: 'Not Required' },
  },
  { timestamps: true },
);

export const Transaction = mongoose.model('Transaction', transactionSchema);
